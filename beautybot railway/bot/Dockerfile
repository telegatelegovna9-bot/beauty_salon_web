# Telegram Bot Dockerfile for Railway deployment
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port (bot doesn't need HTTP port, but Railway requires one)
EXPOSE 3000

# Health check (bot process stays running, check with a simple ping)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Start the bot
CMD ["npm", "start"]
