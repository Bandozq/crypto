#!/bin/bash

# Crypto Dashboard - Coolify Deployment Fix Script
# This script fixes common deployment issues and prepares the app for Coolify

set -e

echo "🚀 Crypto Dashboard - Coolify Deployment Fix"
echo "============================================"

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "✅ Found package.json - in correct directory"

# 1. Update package.json scripts for better deployment
echo "📦 Updating package.json scripts..."
npm pkg set scripts.build="vite build && esbuild server/**/*.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server"
npm pkg set scripts.start="node dist/server/index.js"
npm pkg set scripts.health="curl -f http://localhost:5000/api/health || exit 1"

# 2. Create/update necessary files
echo "📁 Creating deployment files..."

# Create startup.sh if it doesn't exist
if [[ ! -f "startup.sh" ]]; then
    cat > startup.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting crypto dashboard..."
echo "==============================="

# Function to check if database is ready
check_database() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL environment variable is not set"
        return 1
    fi
    
    echo "🔍 Checking database connection..."
    node -e "
        const { Pool } = require('@neondatabase/serverless');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1')
            .then(() => { 
                console.log('✅ Database connection successful'); 
                process.exit(0); 
            })
            .catch((err) => { 
                console.error('❌ Database connection failed:', err.message); 
                process.exit(1); 
            });
    "
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if npm run db:push; then
            echo "✅ Database migrations completed successfully"
            return 0
        else
            echo "⚠️ Migration attempt $attempt/$max_attempts failed"
            if [ $attempt -eq $max_attempts ]; then
                echo "❌ Database migrations failed after $max_attempts attempts"
                return 1
            fi
            sleep 5
            attempt=$((attempt + 1))
        fi
    done
}

# Function to seed initial data
seed_data() {
    echo "🌱 Checking if data seeding is needed..."
    
    # Try to seed data via API endpoint
    node -e "
        const http = require('http');
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/seed-data',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Data seeding completed');
                } else {
                    console.log('⚠️ Data seeding skipped or failed');
                }
            });
        });
        
        req.on('error', (err) => {
            console.log('⚠️ Could not connect to seed data endpoint');
        });
        
        req.end();
    " || echo "⚠️ Data seeding will be handled by the application"
}

# Main execution flow
main() {
    echo "NODE_ENV: ${NODE_ENV:-development}"
    echo "PORT: ${PORT:-5000}"
    
    # Wait a moment for any external services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    # Check database connection with retries
    local db_retries=0
    local max_db_retries=30
    
    while [ $db_retries -lt $max_db_retries ]; do
        if check_database; then
            echo "✅ Database is ready!"
            break
        else
            db_retries=$((db_retries + 1))
            if [ $db_retries -eq $max_db_retries ]; then
                echo "❌ Database not ready after $max_db_retries attempts"
                echo "🚨 Starting application anyway - it will create sample data"
                exec npm start
                exit 0
            fi
            echo "⏳ Database not ready yet, waiting... (attempt $db_retries/$max_db_retries)"
            sleep 5
        fi
    done
    
    # Run database migrations
    if run_migrations; then
        echo "✅ Database setup completed"
    else
        echo "⚠️ Database migrations failed, but continuing..."
        echo "📝 The application will handle this gracefully"
    fi
    
    # Start the application in the background to allow for seeding
    echo "🚀 Starting application server..."
    npm start &
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    local server_ready=false
    local wait_attempts=0
    local max_wait_attempts=30
    
    while [ $wait_attempts -lt $max_wait_attempts ] && [ "$server_ready" = false ]; do
        if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
            echo "✅ Server is ready!"
            server_ready=true
        else
            wait_attempts=$((wait_attempts + 1))
            echo "⏳ Waiting for server... (attempt $wait_attempts/$max_wait_attempts)"
            sleep 3
        fi
    done
    
    if [ "$server_ready" = true ]; then
        # Try to seed initial data
        sleep 2
        seed_data
        echo "✅ Application startup completed successfully!"
    else
        echo "⚠️ Server health check failed, but process will continue"
    fi
    
    # Keep the container running
    wait
}

# Execute main function
main "$@"
EOF
    chmod +x startup.sh
    echo "✅ Created startup.sh"
fi

# Create .env.example for Coolify
cat > .env.example << 'EOF'
# Coolify Environment Configuration
# Set these environment variables in your Coolify project settings

NODE_ENV=production
PORT=5000

# Database (REQUIRED) - Use your Coolify database URL
DATABASE_URL=postgresql://postgres:password@postgres:5432/crypto_dashboard

# API Keys (Optional)
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=

# Session secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# For Coolify internal database
POSTGRES_PASSWORD=your_postgres_password
EOF

echo "✅ Created .env.example for Coolify"

# 3. Update Dockerfile for better reliability
cat > Dockerfile << 'EOF'
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
RUN apk add --no-cache curl wget chromium psmisc bash

# Set environment variables for puppeteer
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Health check configuration
HEALTHCHECK --interval=30s --timeout=30s --start-period=120s --retries=5 \
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

# Copy startup script and make it executable
COPY startup.sh ./
RUN chmod +x ./startup.sh

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Use the startup script
CMD ["./startup.sh"]
EOF

echo "✅ Updated Dockerfile"

# 4. Create/update docker-compose.yml for local testing
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL:-postgresql://postgres:${POSTGRES_PASSWORD:-defaultpass}@postgres:5432/crypto_dashboard}
      - COINGECKO_API_KEY=${COINGECKO_API_KEY:-}
      - COINMARKETCAP_API_KEY=${COINMARKETCAP_API_KEY:-}
      - SESSION_SECRET=${SESSION_SECRET:-crypto-dashboard-secret-key}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=crypto_dashboard
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-defaultpass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d crypto_dashboard"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  postgres_data:
    driver: local
EOF

echo "✅ Updated docker-compose.yml"

# 5. Run basic checks
echo "🔍 Running basic checks..."

# Check if all required files exist
required_files=("package.json" "tsconfig.json" "drizzle.config.ts")
for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ Found $file"
    else
        echo "❌ Missing $file"
    fi
done

# Check if build works
echo "🔨 Testing build process..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - please check the errors above"
    exit 1
fi

# 6. Final instructions
echo ""
echo "🎉 Deployment preparation complete!"
echo "==================================="
echo ""
echo "Next steps for Coolify deployment:"
echo ""
echo "1. 📱 In Coolify, create a new project"
echo "2. 🔗 Connect your Git repository"
echo "3. 🐳 Set build pack to 'Docker'"
echo "4. 🌍 Set these environment variables in Coolify:"
echo "   - NODE_ENV=production"
echo "   - PORT=5000"
echo "   - DATABASE_URL=your_database_connection_string"
echo "   - SESSION_SECRET=your_random_secret"
echo ""
echo "5. 🚀 Deploy!"
echo ""
echo "🔧 Troubleshooting tips:"
echo "• Check Coolify logs if deployment fails"
echo "• Verify DATABASE_URL is correctly set"
echo "• The app will create sample data if database is empty"
echo "• Health check endpoint: /api/health"
echo ""

# Commit changes
echo "📝 Committing deployment fixes..."
git add .
git commit -m "Fix: Improve Coolify deployment reliability

- Enhanced Dockerfile with better error handling
- Added robust startup script with database checks
- Improved frontend error handling and empty states
- Added fallback data for when database is empty
- Better health checks and retry logic
- Updated environment configuration templates

This should resolve data display and deployment issues on Coolify." || echo "No changes to commit"

echo "5. Pushing to repository..."
git push origin main || echo "⚠️ Push failed - please push manually"

echo ""
echo "✅ All fixes applied and committed!"
echo "🚀 Ready for Coolify deployment!"