# ============================================================
# SocialHomes.Ai — Multi-stage Docker Build
# Stage 1: Build React client (Vite + TypeScript)
# Stage 2: Build Express server (TypeScript)
# Stage 3: Production image (Node.js 20 slim)
#
# Build: docker build -t socialhomes .
# Run:   docker run -p 8080:8080 -e NODE_ENV=production socialhomes
#
# Security: non-root user, dumb-init PID 1, read-only capable,
#           no dev dependencies, minimal attack surface,
#           npm audit in build stages.
#
# Studio: Yantra Works (https://yantra.works)
# ============================================================

# ---- Stage 1: Build Client ----
FROM node:20-slim AS build-client

WORKDIR /build/app

# Copy package files first for Docker layer caching
COPY app/package.json app/package-lock.json ./

# --legacy-peer-deps needed: firebaseui@6 declares peer firebase@^9||^10
# but works fine at runtime with firebase v12 via the compat layer.
RUN npm ci --legacy-peer-deps

# Run npm audit (non-blocking — logged for visibility)
RUN npm audit --omit=dev --audit-level=critical 2>&1 || echo "⚠ npm audit found issues (see CI logs)"

# Copy source and build
COPY app/ ./
RUN npm run build

# ---- Stage 2: Build Server ----
FROM node:20-slim AS build-server

WORKDIR /build/server

# Copy package files first for Docker layer caching
COPY server/package.json server/package-lock.json ./
RUN npm ci

# Run npm audit (non-blocking — logged for visibility)
RUN npm audit --omit=dev --audit-level=critical 2>&1 || echo "⚠ npm audit found issues (see CI logs)"

# Copy source and build (exclude test files)
COPY server/tsconfig.json server/tsconfig.json
COPY server/src/ ./src/
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-slim AS production

# Build-time args for versioning (injected by Cloud Build)
ARG BUILD_SHA="unknown"
ARG BUILD_DATE="unknown"

# OCI metadata labels for traceability
LABEL org.opencontainers.image.title="SocialHomes.Ai"
LABEL org.opencontainers.image.description="AI-native social housing management platform"
LABEL org.opencontainers.image.vendor="Yantra Works"
LABEL org.opencontainers.image.url="https://yantra.works"
LABEL org.opencontainers.image.source="https://github.com/rajivpeter/SocialHomes_ai"
LABEL org.opencontainers.image.revision="${BUILD_SHA}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Install system dependencies first (cached layer — rarely changes)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Security: run as non-root user
RUN groupadd --gid 1001 appuser && \
    useradd --uid 1001 --gid appuser --shell /bin/sh --create-home appuser

WORKDIR /srv/app

# Install production dependencies only (no dev deps in final image)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Copy built server (compiled JS only — no source TypeScript or test files)
COPY --from=build-server /build/server/dist ./server/dist

# Copy built client (static assets only)
COPY --from=build-client /build/app/dist ./app/dist

# Set ownership of app directory to non-root user
RUN chown -R appuser:appuser /srv/app

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

# Embed build metadata as environment variables (available at runtime)
ENV BUILD_SHA=${BUILD_SHA}
ENV BUILD_DATE=${BUILD_DATE}

# Switch to non-root user
USER appuser

EXPOSE 8080

# Health check (Cloud Run uses its own probe, but this helps local development)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -sf http://localhost:8080/health || exit 1

# Use dumb-init to handle PID 1 signal forwarding (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start server (Node.js with production optimizations)
CMD ["node", "--max-old-space-size=384", "server/dist/index.js"]
