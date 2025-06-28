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

# Install curl and chromium for health checks and puppeteer
RUN apk add --no-cache curl wget chromium psmisc

# Set environment variables for puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY drizzle.config.ts ./

# Install only production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
# Copy initialization script and make it executable
COPY init-db.sh ./
RUN chmod +x ./init-db.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check - use both curl and wget for redundancy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD (curl -f http://localhost:5000/api/health || wget -q -O - http://localhost:5000/api/health || exit 1)

# Start application - run initialization script then start the app
CMD ["/bin/sh", "-c", "./init-db.sh && echo '🚀 Starting main application...' && npm start"]
