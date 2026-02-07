# =============================================================================
# Multi-stage Dockerfile for Blog Auth API
# Produces a minimal, secure production image (~180MB)
# =============================================================================

# --------------- Stage 1: Install dependencies ---------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first — maximises Docker layer caching
COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

# --------------- Stage 2: Build ---------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Prune devDependencies after build
RUN npm prune --production

# --------------- Stage 3: Production ---------------
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json

# Switch to non-root user
USER nestjs

# Expose the application port
EXPOSE 3000

# Health check — hits the /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
