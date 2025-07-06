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
