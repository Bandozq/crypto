#!/bin/bash

# P2E Games & Airdrops Dashboard - Automated Contabo Deployment Script
# This script automates the deployment process to Contabo VPS with Coolify

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warning "This script should not be run as root for security reasons"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Gather configuration
gather_config() {
    log "Gathering deployment configuration..."
    
    # VPS Information
    read -p "Enter your Contabo VPS IP address: " VPS_IP
    read -p "Enter your VPS username (default: root): " VPS_USER
    VPS_USER=${VPS_USER:-root}
    
    # Domain (optional)
    read -p "Enter your domain name (optional, press enter to skip): " DOMAIN
    
    # API Keys
    echo ""
    info "API Keys Configuration (you can update these later in Coolify)"
    read -p "CoinGecko API Key (optional): " COINGECKO_KEY
    read -p "CoinMarketCap API Key (optional): " COINMARKETCAP_KEY
    read -p "Twitter API Key (optional): " TWITTER_API_KEY
    read -p "Twitter API Secret (optional): " TWITTER_API_SECRET
    read -p "Twitter Bearer Token (optional): " TWITTER_BEARER_TOKEN
    read -p "Twitter Access Token (optional): " TWITTER_ACCESS_TOKEN
    read -p "Twitter Access Token Secret (optional): " TWITTER_ACCESS_TOKEN_SECRET
    
    # Database
    read -p "PostgreSQL password (will be generated if empty): " POSTGRES_PASSWORD
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
        info "Generated PostgreSQL password: $POSTGRES_PASSWORD"
    fi
    
    # Git repository
    read -p "Enter your Git repository URL: " GIT_REPO_URL
    
    echo ""
    log "Configuration gathered successfully!"
}

# Test SSH connection
test_ssh_connection() {
    log "Testing SSH connection to VPS..."
    if ssh -o BatchMode=yes -o ConnectTimeout=10 "$VPS_USER@$VPS_IP" exit 2>/dev/null; then
        log "SSH connection successful"
    else
        error "Cannot connect to VPS via SSH. Please ensure SSH key authentication is set up."
    fi
}

# Create deployment files
create_deployment_files() {
    log "Creating deployment files..."
    
    # Create Dockerfile
    cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/stats || exit 1

# Start application
CMD ["npm", "start"]
EOF

    # Create docker-compose.yml for local testing
    cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/crypto_dashboard
      - COINGECKO_API_KEY=${COINGECKO_KEY}
      - COINMARKETCAP_API_KEY=${COINMARKETCAP_KEY}
      - TWITTER_API_KEY=${TWITTER_API_KEY}
      - TWITTER_API_SECRET=${TWITTER_API_SECRET}
      - TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
      - TWITTER_ACCESS_TOKEN=${TWITTER_ACCESS_TOKEN}
      - TWITTER_ACCESS_TOKEN_SECRET=${TWITTER_ACCESS_TOKEN_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=crypto_dashboard
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
EOF

    # Create .dockerignore
    cat > .dockerignore << 'EOF'
node_modules
.git
.gitignore
README.md
Dockerfile
.dockerignore
docker-compose.yml
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
coverage
.nyc_output
.cache
dist
EOF

    # Update package.json with production scripts
    if [[ -f "package.json" ]]; then
        # Backup original
        cp package.json package.json.backup
        
        # Add production scripts if they don't exist
        node -e "
        const pkg = require('./package.json');
        if (!pkg.scripts.build) pkg.scripts.build = 'tsc && vite build';
        if (!pkg.scripts.start) pkg.scripts.start = 'node dist/server/index.js';
        if (!pkg.scripts['db:push']) pkg.scripts['db:push'] = 'drizzle-kit push:pg';
        require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
    fi

    # Create environment file template
    cat > .env.production << EOF
NODE_ENV=production
DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/crypto_dashboard
COINGECKO_API_KEY=${COINGECKO_KEY}
COINMARKETCAP_API_KEY=${COINMARKETCAP_KEY}
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}
TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
TWITTER_ACCESS_TOKEN=${TWITTER_ACCESS_TOKEN}
TWITTER_ACCESS_TOKEN_SECRET=${TWITTER_ACCESS_TOKEN_SECRET}
EOF

    log "Deployment files created successfully!"
}

# VPS preparation script
create_vps_setup_script() {
    log "Creating VPS setup script..."
    
    cat > vps-setup.sh << 'EOF'
#!/bin/bash

# VPS Setup Script for Crypto Dashboard Deployment
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[ERROR] $1${NC}"; exit 1; }
warning() { echo -e "${YELLOW}[WARNING] $1${NC}"; }

log "Starting VPS setup for Crypto Dashboard..."

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
log "Installing essential packages..."
apt install -y curl wget git nano ufw htop unzip software-properties-common

# Configure firewall
log "Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 8000  # Coolify port
echo "y" | ufw enable

# Install Docker
log "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker

# Add user to docker group if not root
if [[ $USER != "root" ]]; then
    usermod -aG docker $USER
    warning "Please logout and login again for Docker group changes to take effect"
fi

# Install Docker Compose
log "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Coolify
log "Installing Coolify..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Wait for Coolify to start
log "Waiting for Coolify to start..."
sleep 30

# Check if Coolify is running
if docker ps | grep -q coolify; then
    log "Coolify installation successful!"
    log "Access Coolify at: http://$(curl -s ifconfig.me):8000"
else
    error "Coolify installation failed"
fi

# Install security updates
log "Setting up automatic security updates..."
apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/50unattended-upgrades

# Install fail2ban for security
log "Installing fail2ban..."
apt install -y fail2ban
systemctl start fail2ban
systemctl enable fail2ban

log "VPS setup completed successfully!"
log "Next steps:"
log "1. Access Coolify at: http://$(curl -s ifconfig.me):8000"
log "2. Create your admin account"
log "3. Set up your application deployment"

EOF

    chmod +x vps-setup.sh
    log "VPS setup script created!"
}

# Deploy to VPS
deploy_to_vps() {
    log "Deploying to VPS..."
    
    # Copy setup script to VPS
    scp vps-setup.sh "$VPS_USER@$VPS_IP:/tmp/"
    
    # Execute setup script on VPS
    ssh "$VPS_USER@$VPS_IP" "chmod +x /tmp/vps-setup.sh && /tmp/vps-setup.sh"
    
    log "VPS setup completed!"
    info "Coolify should now be accessible at: http://$VPS_IP:8000"
}

# Create Coolify configuration guide
create_coolify_guide() {
    log "Creating Coolify configuration guide..."
    
    cat > COOLIFY_SETUP.md << EOF
# Coolify Setup Guide for P2E Games & Airdrops Dashboard

## 1. Access Coolify
- Open: http://$VPS_IP:8000
- Create your admin account

## 2. Create New Project
1. Click "New Project"
2. Name: "crypto-dashboard"
3. Choose "Git Repository" as source
4. Repository URL: $GIT_REPO_URL

## 3. Application Configuration
### Basic Settings:
- **Name:** crypto-dashboard
- **Port:** 5000
- **Build Pack:** Node.js
- **Node Version:** 18

### Build Configuration:
- **Install Command:** npm ci
- **Build Command:** npm run build
- **Start Command:** npm start

### Environment Variables:
\`\`\`
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/crypto_dashboard
COINGECKO_API_KEY=$COINGECKO_KEY
COINMARKETCAP_API_KEY=$COINMARKETCAP_KEY
TWITTER_API_KEY=$TWITTER_API_KEY
TWITTER_API_SECRET=$TWITTER_API_SECRET
TWITTER_BEARER_TOKEN=$TWITTER_BEARER_TOKEN
TWITTER_ACCESS_TOKEN=$TWITTER_ACCESS_TOKEN
TWITTER_ACCESS_TOKEN_SECRET=$TWITTER_ACCESS_TOKEN_SECRET
\`\`\`

## 4. Database Setup
1. Create PostgreSQL Database:
   - Click "New Database"
   - Choose PostgreSQL 15
   - Database name: crypto_dashboard
   - Username: postgres
   - Password: $POSTGRES_PASSWORD

## 5. Domain Configuration (Optional)
$(if [[ -n "$DOMAIN" ]]; then
echo "- Add domain: $DOMAIN"
echo "- Coolify will handle SSL automatically"
echo "- Point your DNS A record to: $VPS_IP"
else
echo "- No domain configured"
echo "- Application will be accessible via IP"
fi)

## 6. Deployment
1. Click "Deploy"
2. Monitor build logs
3. Once deployed, run database migration:
   \`\`\`bash
   docker exec -it crypto-dashboard npm run db:push
   \`\`\`

## 7. Access Your Application
$(if [[ -n "$DOMAIN" ]]; then
echo "- URL: https://$DOMAIN"
else
echo "- URL: http://$VPS_IP:5000"
fi)

## 8. Monitoring
- Enable monitoring in Coolify
- Set up alerts for downtime and resource usage
- Configure automated backups

## 9. Security Notes
- Firewall is configured to allow only necessary ports
- fail2ban is installed for SSH protection
- Automatic security updates are enabled
- Always use strong passwords for API keys

## Troubleshooting
- Check application logs in Coolify dashboard
- Verify environment variables are set correctly
- Ensure database connection is working
- Monitor resource usage (CPU, Memory, Disk)
EOF

    log "Coolify setup guide created: COOLIFY_SETUP.md"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating monitoring script..."
    
    cat > monitor-deployment.sh << 'EOF'
#!/bin/bash

# Monitoring Script for Crypto Dashboard
# Run this periodically to check application health

VPS_IP="$1"
DOMAIN="$2"

if [[ -z "$VPS_IP" ]]; then
    echo "Usage: $0 <VPS_IP> [domain]"
    exit 1
fi

# Determine URL to check
if [[ -n "$DOMAIN" ]]; then
    URL="https://$DOMAIN"
else
    URL="http://$VPS_IP:5000"
fi

echo "Monitoring Crypto Dashboard at: $URL"
echo "========================================"

# Check application health
echo "1. Checking application health..."
if curl -f -s "$URL/api/stats" > /dev/null; then
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding"
fi

# Check database
echo "2. Checking database connection..."
STATS=$(curl -s "$URL/api/stats")
if echo "$STATS" | grep -q "totalOpportunities"; then
    echo "✅ Database is connected"
    echo "   Total Opportunities: $(echo "$STATS" | grep -o '"totalOpportunities":[0-9]*' | cut -d':' -f2)"
else
    echo "❌ Database connection failed"
fi

# Check data sources
echo "3. Checking data sources..."
SOURCES=$(curl -s "$URL/api/data-sources/status")
if echo "$SOURCES" | grep -q "coingecko"; then
    echo "✅ Data sources API is responding"
    
    # Check individual sources
    if echo "$SOURCES" | grep -q '"active":true'; then
        echo "   Active data sources found"
    else
        echo "   ⚠️  Some data sources may be inactive"
    fi
else
    echo "❌ Data sources check failed"
fi

# Check SSL (if domain is used)
if [[ -n "$DOMAIN" ]]; then
    echo "4. Checking SSL certificate..."
    if openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo "✅ SSL certificate is valid"
    else
        echo "❌ SSL certificate issue"
    fi
fi

echo "========================================"
echo "Monitoring completed at: $(date)"
EOF

    chmod +x monitor-deployment.sh
    log "Monitoring script created: monitor-deployment.sh"
}

# Main execution
main() {
    log "Starting P2E Games & Airdrops Dashboard deployment automation..."
    
    check_root
    gather_config
    test_ssh_connection
    create_deployment_files
    create_vps_setup_script
    deploy_to_vps
    create_coolify_guide
    create_monitoring_script
    
    echo ""
    log "Deployment automation completed!"
    echo ""
    info "What's been done:"
    info "✅ VPS prepared with Docker and Coolify"
    info "✅ Deployment files created"
    info "✅ Configuration guides generated"
    info "✅ Monitoring script prepared"
    echo ""
    info "Next steps:"
    info "1. Access Coolify at: http://$VPS_IP:8000"
    info "2. Follow the guide in COOLIFY_SETUP.md"
    info "3. Use monitor-deployment.sh to check application health"
    echo ""
    warning "Important: Update your Git repository with the new Dockerfile and deployment files"
    warning "Commit and push: Dockerfile, docker-compose.yml, and updated package.json"
    echo ""
    log "Deployment automation script completed successfully!"
}

# Run main function
main "$@"
EOF

chmod +x deploy-to-contabo.sh