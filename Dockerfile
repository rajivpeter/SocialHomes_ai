# ============================================================
# SocialHomes.Ai — Multi-stage Docker Build
# Stage 1: Build React client (Vite + TypeScript)
# Stage 2: Build Express server (TypeScript)
# Stage 3: Production image (Node.js 20 slim)
#
# Build: docker build -t socialhomes .
# Run:   docker run -p 8080:8080 -e NODE_ENV=production socialhomes
# ============================================================

# ---- Stage 1: Build Client ----
FROM node:20-slim AS build-client

WORKDIR /build/app

# Copy package files first for Docker layer caching
COPY app/package.json app/package-lock.json ./

# --legacy-peer-deps needed: firebaseui@6 declares peer firebase@^9||^10
# but works fine at runtime with firebase v12 via the compat layer.
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY app/ ./
RUN npm run build

# ---- Stage 2: Build Server ----
FROM node:20-slim AS build-server

WORKDIR /build/server

# Copy package files first for Docker layer caching
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Copy source and build
COPY server/ ./
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-slim AS production

# Security: run as non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/sh --create-home appuser

WORKDIR /srv/app

# Install production dependencies only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Copy built server
COPY --from=build-server /build/server/dist ./server/dist

# Copy built client
COPY --from=build-client /build/app/dist ./app/dist

# Install curl for health checks and dumb-init for proper signal handling
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

# Switch to non-root user
USER appuser

EXPOSE 8080

# Health check (Cloud Run uses its own probe, but this helps local development)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:8080/health || exit 1

# Use dumb-init to handle PID 1 signal forwarding (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "server/dist/index.js"]
