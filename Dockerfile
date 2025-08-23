# Multi-stage Dockerfile for SPCS React + Express applications
# This follows the proven pattern from the Sun Valley reference

# Builder stage - Build React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage - Create lightweight production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install production dependencies only
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

# Copy server file and built React application
COPY --from=builder --chown=nodejs:nodejs /app/server.js ./
COPY --from=builder --chown=nodejs:nodejs /app/build ./build/

# Switch to non-root user
USER nodejs

# Expose port 3002 (SPCS standard)
EXPOSE 3002

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Use dumb-init for proper signal handling in containers
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
