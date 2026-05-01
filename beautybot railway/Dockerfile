# Multi-service Dockerfile for Railway deployment
# Runs: Backend API + Telegram Bot + Frontend (nginx)
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS bot-builder

WORKDIR /app/bot

COPY bot/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM nginx:alpine AS frontend-stage

WORKDIR /app/frontend

COPY frontend/ .

# Final stage
FROM node:20-alpine

# Install curl for health checks and nginx, supervisor
RUN apk add --no-cache curl nginx supervisor

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Copy bot from builder
COPY --from=bot-builder --chown=nodejs:nodejs /app/bot/node_modules ./bot/node_modules
COPY bot ./bot

# Copy frontend from builder
COPY --from=frontend-stage --chown=nodejs:nodejs /app/frontend /usr/share/nginx/html

# Create necessary directories
RUN mkdir -p /app/backend/data /app/backend/uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Copy supervisor config to run all services
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports (backend API + frontend nginx)
EXPOSE 3001 80

# Health check (check backend API)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start supervisor (runs all services)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
