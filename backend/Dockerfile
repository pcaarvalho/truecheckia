# =============================================================================
# Backend Production Dockerfile - Multi-stage optimized
# =============================================================================

# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install security updates and runtime dependencies
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl tini && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

# Create required directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy startup script
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh ./

# Make startup script executable
USER root
RUN chmod +x docker-entrypoint.sh
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Use tini as PID 1 for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["./docker-entrypoint.sh"]