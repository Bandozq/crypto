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
