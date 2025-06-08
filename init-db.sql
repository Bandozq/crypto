-- Database initialization script for crypto dashboard
-- This script ensures the database is properly set up

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (will be handled by Drizzle migrations)
-- This file is mainly for ensuring the database is ready
