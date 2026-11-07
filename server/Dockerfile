# ==============================================================================
# Production Dockerfile for Lab Portal Express + Prisma Backend
# ==============================================================================

# Stage 1: Dependencies & Prisma Generation
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native bindings and Prisma engines
RUN apk add --no-cache openssl libc6-compat

# Install package dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client for Linux Alpine
RUN npx prisma generate

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime utilities (curl for container healthcheck)
RUN apk add --no-cache openssl libc6-compat curl bash

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root system group and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expressjs -u 1001 -G nodejs

# Copy dependencies, Prisma client, and schema from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Copy application source code and seed assets
COPY src ./src/
COPY sample-data ./sample-data/
COPY docker-entrypoint.sh ./

# Fix any Windows CRLF endings, mark entrypoint executable, and set ownership
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && \
    chmod +x ./docker-entrypoint.sh && \
    chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 3000

# Container healthcheck querying Express /api/health endpoint
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]

