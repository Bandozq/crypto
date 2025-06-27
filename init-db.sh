#!/bin/bash

# Database initialization script for crypto dashboard
set -e

echo "🔄 Initializing database schema..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
for i in {1..30}; do
  if npm run db:push; then
    echo "✅ Database schema initialized successfully!"
    exit 0
  fi
  echo "⏳ Database not ready yet, waiting 2 seconds... (attempt $i/30)"
  sleep 2
done

echo "❌ Failed to initialize database schema after multiple attempts"
exit 1
