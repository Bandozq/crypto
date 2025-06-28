# Multi-stage build for smaller production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dependencies for health checks and puppeteer
RUN apk add --no-cache curl wget chromium psmisc

# Set environment variables for puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Health check configuration
HEALTHCHECK --interval=30s --timeout=30s --start-period=90s --retries=5 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy initialization script and make it executable
COPY init-db.sh ./
RUN chmod +x ./init-db.sh

# Change ownership of app directory (including the init script)
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Start application - run initialization then start the app
CMD ["/bin/sh", "-c", "\
echo '🚀 Starting crypto dashboard initialization...' && \
echo '⏳ Waiting for database to be ready...' && \
sleep 5 && \
echo '🔄 Running database migrations...' && \
for i in $(seq 1 30); do \
  if npm run db:push 2>/dev/null; then \
    echo '✅ Database migrations completed successfully!'; \
    break; \
  elif [ $i -eq 30 ]; then \
    echo '⚠️ Database migrations failed after 30 attempts. Continuing anyway...'; \
    break; \
  else \
    echo \"⏳ Migration attempt $i failed, retrying in 3 seconds...\"; \
    sleep 3; \
  fi; \
done && \
echo '🔄 Running data scraper...' && \
(node dist/server/run-scraper.js || echo '⚠️ Scraper failed, continuing...') && \
echo '🚀 Starting main application in background...' && \
(npm start &) && \
echo '⏳ Waiting for server to start...' && \
sleep 10 && \
echo '✅ Server started successfully!' && \
tail -f /dev/null"]
