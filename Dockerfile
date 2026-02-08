# ============================================================
# SocialHomes.Ai — Multi-stage Docker Build
# Stage 1: Build React client
# Stage 2: Build Express server
# Stage 3: Production image
# ============================================================

# ---- Stage 1: Build Client ----
FROM node:20-slim AS build-client

WORKDIR /build/app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# ---- Stage 2: Build Server ----
FROM node:20-slim AS build-server

WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---- Stage 3: Production ----
FROM node:20-slim AS production

WORKDIR /srv/app

# Install production dependencies only
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy built server
COPY --from=build-server /build/server/dist ./server/dist

# Copy built client
COPY --from=build-client /build/app/dist ./app/dist

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Start server
CMD ["node", "server/dist/index.js"]
