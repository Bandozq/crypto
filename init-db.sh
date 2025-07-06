#!/bin/bash

echo "🔄 Starting database initialization process..."

# Function to check if database is ready
check_database() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL environment variable is not set"
        return 1
    fi
    
    # Extract database connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    
    echo "🔍 Checking database connection to $DB_HOST:$DB_PORT/$DB_NAME..."
    
    # Use pg_isready if available, otherwise use a simple connection test
    if command -v pg_isready >/dev/null 2>&1; then
        pg_isready -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER"
    else
        # Fallback: try to connect using node
        node -e "
        const { Pool } = require('@neondatabase/serverless');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT 1')
          .then(() => { console.log('Database connection successful'); process.exit(0); })
          .catch((err) => { console.error('Database connection failed:', err.message); process.exit(1); });
        "
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Try to run migrations with retries
    for i in {1..5}; do
        if npm run db:push 2>/dev/null; then
            echo "✅ Database migrations completed successfully"
            return 0
        else
            echo "⚠️ Migration attempt $i failed, retrying in 3 seconds..."
            sleep 3
        fi
    done
    
    echo "❌ Database migrations failed after 5 attempts"
    return 1
}

# Function to run the scraper
run_scraper() {
    echo "🔄 Running data scraper..."
    
    if node dist/server/run-scraper.js; then
        echo "✅ Data scraper completed successfully"
        return 0
    else
        echo "⚠️ Data scraper failed, but continuing with application startup..."
        return 0  # Don't fail the entire process if scraper fails
    fi
}

# Main initialization process
main() {
    echo "🚀 Starting crypto dashboard initialization..."
    
    # Wait for database to be ready
    echo "⏳ Waiting for database to be ready..."
    for i in {1..30}; do
        if check_database; then
            echo "✅ Database is ready!"
            break
        elif [ $i -eq 30 ]; then
            echo "❌ Database not ready after 30 attempts. Proceeding anyway..."
            break
        else
            echo "⏳ Database not ready yet, waiting 2 seconds... (attempt $i/30)"
            sleep 2
        fi
    done
    
    # Run database migrations
    if run_migrations; then
        echo "✅ Database setup completed"
    else
        echo "⚠️ Database setup had issues, but continuing..."
    fi
    
    # Run the scraper to populate initial data
    run_scraper
    
    echo "🎉 Initialization process completed!"
}

# Run the main function
main
