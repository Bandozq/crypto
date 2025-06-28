# Crypto Dashboard Deployment Guide

## Issue Resolution: App Not Displaying Data After Deployment

This guide addresses the common issue where the crypto dashboard application starts successfully but doesn't display any data on the frontend.

## Root Causes Identified

1. **Environment Variable Configuration**: The application relies on environment variables that may not be properly set in production
2. **Database Initialization Timing**: Database migrations may fail if the database isn't ready when the container starts
3. **Data Seeding Issues**: The scraper may fail to populate initial data

## Solutions Implemented

### 1. Robust Database Initialization

- **New `init-db.sh` script**: Handles database connection waiting, migrations, and data seeding
- **Improved startup process**: Separates initialization from application startup
- **Retry logic**: Multiple attempts for database operations with exponential backoff

### 2. Environment Variable Fixes

- **Updated `package.json`**: Removed `--env-file=.env` from production start script
- **Enhanced `drizzle.config.ts`**: Added `dotenv/config` import for CLI commands
- **Clear documentation**: Updated `.env.production.template` with detailed instructions

### 3. Fallback Data Mechanism

- **Emergency seed endpoint**: `/api/seed-data` for manual data population
- **Sample data**: Hardcoded fallback data when APIs fail
- **Graceful degradation**: Application continues even if scraper fails

## Deployment Steps

### Using Docker Compose (Recommended)

1. **Set Environment Variables**:
   ```bash
   # Copy and edit the environment template
   cp .env.production.template .env.production
   
   # Edit .env.production with your actual values
   nano .env.production
   ```

2. **Required Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://postgres:your_password@postgres:5432/crypto_dashboard
   POSTGRES_PASSWORD=your_password_here
   NODE_ENV=production
   PORT=5000
   ```

3. **Optional API Keys** (for better data):
   ```bash
   COINGECKO_API_KEY=your_coingecko_api_key
   COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
   ```

4. **Deploy**:
   ```bash
   # Build and start the application
   docker-compose up --build -d
   
   # Check logs
   docker-compose logs -f app
   ```

### Using Cloud Platforms

#### For platforms like Railway, Render, Vercel, etc.:

1. **Set Environment Variables** in your platform's dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or platform default)
   - `COINGECKO_API_KEY`: (optional) Your CoinGecko API key

2. **Database Setup**:
   - Ensure your PostgreSQL database is accessible
   - The application will automatically run migrations on startup

3. **Manual Data Seeding** (if needed):
   ```bash
   # If no data appears, trigger manual seeding
   curl -X POST https://your-app-url.com/api/seed-data
   ```

## Troubleshooting

### 1. No Data Displayed

**Check the API endpoints**:
```bash
# Check if the server is running
curl https://your-app-url.com/api/health

# Check if data exists
curl https://your-app-url.com/api/opportunities

# Check stats
curl https://your-app-url.com/api/stats
```

**If APIs return empty arrays**:
```bash
# Manually seed data
curl -X POST https://your-app-url.com/api/seed-data
```

### 2. Database Connection Issues

**Check environment variables**:
- Ensure `DATABASE_URL` is correctly formatted
- Verify database credentials and accessibility
- Check if database server is running

**Docker Compose specific**:
```bash
# Check if postgres container is healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Check app logs
docker-compose logs app
```

### 3. Application Won't Start

**Check the logs**:
```bash
# Docker Compose
docker-compose logs app

# Cloud platforms usually provide log access in their dashboard
```

**Common issues**:
- Missing `DATABASE_URL` environment variable
- Database not accessible
- Port conflicts

### 4. API Keys Not Working

The application will work without API keys but with limited data:
- **Without CoinGecko API**: Uses fallback trending data
- **Without CoinMarketCap API**: Skips new listings
- **Without Twitter API**: No social sentiment data

## Verification Steps

1. **Health Check**:
   ```bash
   curl https://your-app-url.com/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Data Check**:
   ```bash
   curl https://your-app-url.com/api/opportunities
   # Should return an array of opportunities
   ```

3. **Frontend Check**:
   - Visit your application URL
   - Dashboard should display opportunity cards
   - Check browser console for any JavaScript errors

## Performance Optimization

1. **Database Indexing**: The application automatically creates necessary indexes
2. **Caching**: Consider adding Redis for API response caching
3. **CDN**: Use a CDN for static assets in production
4. **Monitoring**: Set up health checks and monitoring

## Security Considerations

1. **Environment Variables**: Never commit real API keys to version control
2. **Database Access**: Ensure database is not publicly accessible
3. **HTTPS**: Always use HTTPS in production
4. **Session Secret**: Use a strong, random session secret

## Support

If you continue to experience issues:

1. Check the application logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure the database is accessible and properly configured
4. Try the manual data seeding endpoint: `POST /api/seed-data`

The application is designed to be resilient and should work even with minimal configuration. The most critical requirement is a properly configured `DATABASE_URL`.
