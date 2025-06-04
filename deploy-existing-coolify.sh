#!/bin/bash

# P2E Games & Airdrops Dashboard - Deployment Script for Existing Coolify Installation
# This script prepares your project for deployment to an existing Coolify setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }
info() { echo -e "${BLUE}[INFO] $1${NC}"; }

# Configuration gathering
gather_config() {
    log "Gathering deployment configuration..."
    
    read -p "Enter your Coolify dashboard URL (e.g., https://coolify.yourdomain.com or http://VPS_IP:8000): " COOLIFY_URL
    read -p "Enter your domain name (optional, press enter to skip): " DOMAIN
    read -p "Enter your Git repository URL: " GIT_REPO_URL
    
    # API Keys
    echo ""
    info "API Keys Configuration"
    read -p "CoinGecko API Key (press enter to use existing): " COINGECKO_KEY
    read -p "CoinMarketCap API Key (press enter to use existing): " COINMARKETCAP_KEY
    read -p "Twitter API Key (press enter to use existing): " TWITTER_API_KEY
    read -p "Twitter API Secret (press enter to use existing): " TWITTER_API_SECRET
    read -p "Twitter Bearer Token (press enter to use existing): " TWITTER_BEARER_TOKEN
    read -p "Twitter Access Token (press enter to use existing): " TWITTER_ACCESS_TOKEN
    read -p "Twitter Access Token Secret (press enter to use existing): " TWITTER_ACCESS_TOKEN_SECRET
    
    # Database password
    read -p "PostgreSQL password (will be generated if empty): " POSTGRES_PASSWORD
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        info "Generated PostgreSQL password: $POSTGRES_PASSWORD"
    fi
    
    log "Configuration gathered successfully!"
}

# Create production-ready Dockerfile
create_dockerfile() {
    log "Creating optimized Dockerfile..."
    
    cat > Dockerfile << 'EOF'
# Multi-stage build for smaller production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/api/stats || exit 1

# Start application
CMD ["npm", "start"]
EOF

    log "Dockerfile created successfully!"
}

# Create docker-compose for local testing
create_docker_compose() {
    log "Creating docker-compose.yml for local testing..."
    
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:\${POSTGRES_PASSWORD:-defaultpass}@postgres:5432/crypto_dashboard
      - COINGECKO_API_KEY=\${COINGECKO_API_KEY:-}
      - COINMARKETCAP_API_KEY=\${COINMARKETCAP_API_KEY:-}
      - TWITTER_API_KEY=\${TWITTER_API_KEY:-}
      - TWITTER_API_SECRET=\${TWITTER_API_SECRET:-}
      - TWITTER_BEARER_TOKEN=\${TWITTER_BEARER_TOKEN:-}
      - TWITTER_ACCESS_TOKEN=\${TWITTER_ACCESS_TOKEN:-}
      - TWITTER_ACCESS_TOKEN_SECRET=\${TWITTER_ACCESS_TOKEN_SECRET:-}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=crypto_dashboard
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-defaultpass}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d crypto_dashboard"]
      interval: 30s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local

networks:
  default:
    name: crypto-dashboard-network
EOF

    log "docker-compose.yml created successfully!"
}

# Create optimized .dockerignore
create_dockerignore() {
    log "Creating .dockerignore..."
    
    cat > .dockerignore << 'EOF'
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist
build
.next

# Development files
.git
.gitignore
README.md
.eslintrc*
.prettierrc*
tsconfig.json

# Test files
coverage
.nyc_output
test
tests
__tests__
*.test.js
*.test.ts
*.spec.js
*.spec.ts

# Cache
.cache
.parcel-cache

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Deployment files
docker-compose.yml
Dockerfile
.dockerignore
deploy-*.sh
*.md

# Logs
logs
*.log

# Temporary files
tmp
temp
EOF

    log ".dockerignore created successfully!"
}

# Update package.json for production
update_package_json() {
    log "Updating package.json for production deployment..."
    
    if [[ ! -f "package.json" ]]; then
        error "package.json not found in current directory"
    fi
    
    # Backup original
    cp package.json package.json.backup
    
    # Update scripts using Node.js
    node -e "
    const fs = require('fs');
    const pkg = require('./package.json');
    
    // Ensure required scripts exist
    if (!pkg.scripts) pkg.scripts = {};
    
    // Production build and start scripts
    pkg.scripts.build = pkg.scripts.build || 'tsc && vite build';
    pkg.scripts.start = pkg.scripts.start || 'node dist/server/index.js';
    pkg.scripts['db:push'] = pkg.scripts['db:push'] || 'drizzle-kit push:pg';
    pkg.scripts['db:migrate'] = pkg.scripts['db:migrate'] || 'drizzle-kit migrate';
    
    // Add health check script
    pkg.scripts.health = 'curl -f http://localhost:5000/api/stats || exit 1';
    
    // Production dependencies check
    pkg.scripts['deps:check'] = 'npm audit --audit-level moderate';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ package.json updated successfully');
    " || error "Failed to update package.json"
    
    log "package.json updated for production!"
}

# Create database initialization script
create_db_init() {
    log "Creating database initialization script..."
    
    cat > init-db.sql << 'EOF'
-- Database initialization script for crypto dashboard
-- This script ensures the database is properly set up

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be handled by Drizzle migrations)
-- This file is mainly for ensuring the database is ready
EOF

    log "Database initialization script created!"
}

# Create environment template
create_env_template() {
    log "Creating environment configuration template..."
    
    cat > .env.production.template << EOF
# Production Environment Configuration
# Copy this file to .env.production and fill in your values

# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/crypto_dashboard

# API Keys
COINGECKO_API_KEY=${COINGECKO_KEY}
COINMARKETCAP_API_KEY=${COINMARKETCAP_KEY}

# Twitter API
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
TWITTER_ACCESS_TOKEN=${TWITTER_ACCESS_TOKEN}
TWITTER_ACCESS_TOKEN_SECRET=${TWITTER_ACCESS_TOKEN_SECRET}

# Security
SESSION_SECRET=\$(openssl rand -base64 32)

# Optional: Email notifications (if implementing)
# SENDGRID_API_KEY=your_sendgrid_key
# FROM_EMAIL=noreply@yourdomain.com
EOF

    log "Environment template created!"
}

# Create Coolify configuration guide
create_coolify_config_guide() {
    log "Creating Coolify configuration guide..."
    
    cat > COOLIFY_DEPLOYMENT_GUIDE.md << EOF
# Coolify Deployment Guide for P2E Games & Airdrops Dashboard

## Quick Setup Checklist

### 1. Access Your Coolify Dashboard
- URL: ${COOLIFY_URL}
- Login with your admin credentials

### 2. Create New Application
1. **Project Creation:**
   - Click "New Project" or use existing project
   - Name: \`crypto-dashboard\`

2. **Source Configuration:**
   - Source Type: Git Repository
   - Repository: \`${GIT_REPO_URL}\`
   - Branch: \`main\` (or your deployment branch)

### 3. Application Settings
\`\`\`
Name: crypto-dashboard
Port: 5000
Build Pack: Dockerfile
\`\`\`

### 4. Environment Variables
Copy and paste these into Coolify's environment variables section:

\`\`\`
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/crypto_dashboard$(if [[ -n "$COINGECKO_KEY" ]]; then echo "
COINGECKO_API_KEY=${COINGECKO_KEY}"; fi)$(if [[ -n "$COINMARKETCAP_KEY" ]]; then echo "
COINMARKETCAP_API_KEY=${COINMARKETCAP_KEY}"; fi)$(if [[ -n "$TWITTER_API_KEY" ]]; then echo "
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
TWITTER_ACCESS_TOKEN=${TWITTER_ACCESS_TOKEN}
TWITTER_ACCESS_TOKEN_SECRET=${TWITTER_ACCESS_TOKEN_SECRET}"; fi)
\`\`\`

### 5. Database Setup
1. **Create PostgreSQL Database:**
   - Go to "Databases" section in Coolify
   - Click "New Database"
   - Choose PostgreSQL 15
   - Configuration:
     \`\`\`
     Name: crypto-dashboard-db
     Database: crypto_dashboard
     Username: postgres
     Password: ${POSTGRES_PASSWORD}
     \`\`\`

2. **Update DATABASE_URL:**
   - After database creation, update the DATABASE_URL in your app's environment variables
   - Use the internal connection string provided by Coolify

### 6. Domain Configuration$(if [[ -n "$DOMAIN" ]]; then echo "
- **Custom Domain:** ${DOMAIN}
- Add domain in Coolify's \"Domains\" section
- Coolify will automatically handle SSL via Let's Encrypt
- Update your DNS A record to point to your VPS IP"; else echo "
- **No custom domain configured**
- Application will be accessible via generated Coolify subdomain
- To add custom domain later, use Coolify's domain management"; fi)

### 7. Build Configuration
Coolify will automatically detect the Dockerfile. Ensure these settings:

\`\`\`
Build Command: (automatic via Dockerfile)
Start Command: (automatic via Dockerfile)
Health Check URL: /api/stats
\`\`\`

### 8. Deployment Process
1. Click "Deploy" in Coolify
2. Monitor build logs for any errors
3. Wait for deployment to complete
4. Check application health

### 9. Post-Deployment Steps
1. **Database Migration:**
   \`\`\`bash
   # In Coolify's application terminal
   npm run db:push
   \`\`\`

2. **Verify Application:**
   - Check health endpoint: \`/api/stats\`
   - Verify data sources: \`/api/data-sources/status\`
   - Test main functionality

### 10. Monitoring Setup
1. **Enable Monitoring:**
   - Turn on monitoring in Coolify
   - Set up alerts for downtime
   - Configure resource monitoring

2. **Log Management:**
   - Application logs available in Coolify dashboard
   - Set log retention policy
   - Monitor error rates

### 11. Backup Configuration
1. **Database Backups:**
   - Enable automatic backups in Coolify
   - Set retention period (recommended: 7 days)
   - Test backup restoration

2. **Application Backups:**
   - Ensure your Git repository is up to date
   - Tag releases for easy rollbacks

## Troubleshooting

### Common Issues:
1. **Build Failures:**
   - Check Node.js version in Dockerfile
   - Verify all dependencies in package.json
   - Review build logs in Coolify

2. **Database Connection:**
   - Verify DATABASE_URL format
   - Ensure database service is running
   - Check network connectivity between services

3. **API Rate Limits:**
   - Monitor API usage in application logs
   - Verify API keys are correct
   - Check rate limiting in external services

4. **Memory/Performance:**
   - Monitor resource usage in Coolify
   - Adjust container resources if needed
   - Optimize application performance

### Health Check Commands:
\`\`\`bash
# Test application health
curl -f http://your-domain/api/stats

# Check database connection
curl -f http://your-domain/api/data-sources/status

# Monitor logs
docker logs crypto-dashboard
\`\`\`

## Security Notes
- All environment variables are encrypted in Coolify
- SSL certificates are automatically managed
- Database passwords are securely stored
- Regular security updates recommended

## Support
- Coolify Documentation: https://coolify.io/docs
- Application Issues: Check GitHub repository
- Performance Monitoring: Use Coolify's built-in tools
EOF

    log "Coolify configuration guide created: COOLIFY_DEPLOYMENT_GUIDE.md"
}

# Create monitoring and maintenance scripts
create_maintenance_scripts() {
    log "Creating maintenance scripts..."
    
    # Health check script
    cat > health-check.sh << 'EOF'
#!/bin/bash

# Health Check Script for Crypto Dashboard
DOMAIN="$1"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain_or_ip>"
    echo "Example: $0 https://crypto.yourdomain.com"
    echo "Example: $0 http://192.168.1.100:5000"
    exit 1
fi

echo "🔍 Checking Crypto Dashboard Health at: $DOMAIN"
echo "================================================"

# Application health
echo "1. Application Health Check..."
if curl -f -s "$DOMAIN/api/stats" > /dev/null; then
    STATS=$(curl -s "$DOMAIN/api/stats")
    TOTAL_OPS=$(echo "$STATS" | grep -o '"totalOpportunities":[0-9]*' | cut -d':' -f2)
    echo "✅ Application is healthy"
    echo "   Total Opportunities: $TOTAL_OPS"
else
    echo "❌ Application health check failed"
fi

# Data sources
echo "2. Data Sources Check..."
if curl -f -s "$DOMAIN/api/data-sources/status" > /dev/null; then
    echo "✅ Data sources API responding"
    SOURCES=$(curl -s "$DOMAIN/api/data-sources/status")
    
    # Check individual sources
    for source in coingecko coinmarketcap twitter; do
        if echo "$SOURCES" | grep -q "\"$source\":{\"active\":true"; then
            echo "   ✅ $source: Active"
        else
            echo "   ⚠️  $source: Inactive or error"
        fi
    done
else
    echo "❌ Data sources check failed"
fi

# Performance check
echo "3. Performance Check..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$DOMAIN/api/stats")
echo "   Response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    echo "   ✅ Good performance"
elif (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    echo "   ⚠️  Slow performance"
else
    echo "   ❌ Poor performance"
fi

echo "================================================"
echo "Health check completed at: $(date)"
EOF

    chmod +x health-check.sh

    # Update script
    cat > update-deployment.sh << 'EOF'
#!/bin/bash

# Update Deployment Script
set -e

echo "🚀 Updating Crypto Dashboard Deployment"
echo "======================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Update dependencies
echo "1. Checking for dependency updates..."
npm audit --audit-level moderate

# Build and test locally (optional)
read -p "Build and test locally before deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "2. Building application locally..."
    npm run build
    
    echo "3. Running health check..."
    npm run health || echo "⚠️  Health check failed - proceed with caution"
fi

# Commit and push changes
echo "4. Committing changes..."
git add .
read -p "Enter commit message: " COMMIT_MSG
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

echo "5. Pushing to repository..."
git push origin main

echo "✅ Update pushed to repository"
echo "   Coolify will automatically detect and deploy changes"
echo "   Monitor the deployment in your Coolify dashboard"
EOF

    chmod +x update-deployment.sh

    log "Maintenance scripts created successfully!"
}

# Test local build
test_local_build() {
    log "Testing local Docker build..."
    
    if command -v docker &> /dev/null; then
        info "Building Docker image locally to test..."
        if docker build -t crypto-dashboard-test . > build.log 2>&1; then
            log "✅ Docker build successful"
            docker rmi crypto-dashboard-test 2>/dev/null || true
        else
            warning "Docker build failed. Check build.log for details."
            error "Please fix build issues before deploying"
        fi
    else
        warning "Docker not found. Skipping local build test."
        info "Make sure your Dockerfile builds successfully in Coolify"
    fi
}

# Main execution
main() {
    log "Starting P2E Games & Airdrops Dashboard deployment preparation..."
    
    gather_config
    create_dockerfile
    create_docker_compose
    create_dockerignore
    update_package_json
    create_db_init
    create_env_template
    create_coolify_config_guide
    create_maintenance_scripts
    test_local_build
    
    echo ""
    log "🎉 Deployment preparation completed!"
    echo ""
    info "Files created:"
    info "📄 Dockerfile - Optimized production container"
    info "📄 docker-compose.yml - Local testing setup"
    info "📄 .dockerignore - Build optimization"
    info "📄 init-db.sql - Database initialization"
    info "📄 .env.production.template - Environment template"
    info "📄 COOLIFY_DEPLOYMENT_GUIDE.md - Step-by-step deployment guide"
    info "📄 health-check.sh - Application monitoring"
    info "📄 update-deployment.sh - Update automation"
    echo ""
    info "Next steps:"
    info "1. Review and commit all generated files to your Git repository"
    info "2. Follow the guide in COOLIFY_DEPLOYMENT_GUIDE.md"
    info "3. Configure your application in Coolify dashboard"
    info "4. Deploy and monitor using the provided scripts"
    echo ""
    warning "Important: Commit and push all files to your repository before deploying!"
    echo ""
    log "Deployment preparation script completed successfully! 🚀"
}

# Run main function
main "$@"