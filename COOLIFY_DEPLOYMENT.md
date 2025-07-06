# Coolify Deployment Guide

## Quick Setup Checklist

### 1. Environment Variables (Set in Coolify Dashboard)

```bash
# Required Variables
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/crypto_dashboard

# Optional API Keys (for real data)
COINGECKO_API_KEY=your_coingecko_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Security
SESSION_SECRET=your_random_session_secret_here
POSTGRES_PASSWORD=your_postgres_password
```

### 2. Database Setup in Coolify

1. Add a PostgreSQL service to your project
2. Set the database name to: `crypto_dashboard`
3. Set the password and use the same in `DATABASE_URL`
4. Make sure the PostgreSQL service is named `postgres`

### 3. Build Command

```bash
npm install && npm run build
```

### 4. Start Command

```bash
npm start
```

## Troubleshooting

### ❌ No Data Displayed

**Check these URLs in your browser:**

1. **Health Check**: `https://your-app.coolify.io/api/health`
   - Should return: `{"status":"ok","database":"connected"}`

2. **Opportunities API**: `https://your-app.coolify.io/api/opportunities`
   - Should return: Array of opportunities

3. **Manual Data Seeding**: `POST https://your-app.coolify.io/api/seed-data`
   - Use curl or browser dev tools to make POST request

### ❌ Database Connection Failed

**Common Issues:**

1. **Wrong DATABASE_URL format**
   ```bash
   # ✅ Correct
   DATABASE_URL=postgresql://postgres:password@postgres:5432/crypto_dashboard
   
   # ❌ Wrong (URL encoded)
   DATABASE_URL=postgresql://postgres:password%40@postgres:5432/crypto_dashboard
   ```

2. **PostgreSQL service not ready**
   - Check Coolify logs for PostgreSQL service
   - Ensure service is named `postgres`

3. **Password mismatch**
   - `POSTGRES_PASSWORD` must match password in `DATABASE_URL`

### ❌ Frontend Not Loading

**Check these:**

1. **Build files exist**: Look for "Static files found" in logs
2. **Port mismatch**: Ensure PORT=5000 in environment
3. **Build process**: Check if `npm run build` completed successfully

### ❌ API Timeouts

**Solutions:**

1. **Increase timeouts**:
   ```bash
   HEALTH_CHECK_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=10000
   ```

2. **Check resource limits** in Coolify
3. **Monitor memory usage** in application logs

## Verification Steps

### 1. Check Application Logs

Look for these success messages:
```
✅ Server running successfully on port 5000
🌐 Health check available at: http://localhost:5000/api/health
🔍 Startup health check: ✅ HEALTHY
```

### 2. Test API Endpoints

```bash
# Health check
curl https://your-app.coolify.io/api/health

# Get opportunities
curl https://your-app.coolify.io/api/opportunities

# Seed sample data (if needed)
curl -X POST https://your-app.coolify.io/api/seed-data
```

### 3. Check Database

The health check endpoint now includes database connection testing.

## Common Coolify-Specific Issues

### Resource Limits
- Ensure adequate memory (512MB minimum recommended)
- CPU limits may cause timeout issues

### Networking
- Database service must be accessible from app container
- Use service name `postgres` in DATABASE_URL

### Environment Variables
- Set all variables in Coolify dashboard, not in files
- Avoid URL encoding in DATABASE_URL

## Performance Optimization

1. **Enable caching headers** (already implemented)
2. **Use PostgreSQL connection pooling** (configured)
3. **Monitor memory usage** with health endpoint
4. **Set appropriate resource limits** in Coolify

## Support

If issues persist:

1. Check Coolify application logs
2. Check PostgreSQL service logs
3. Test health endpoint: `/api/health`
4. Use manual data seeding: `POST /api/seed-data`

The application is designed to be resilient and will work even with minimal configuration.