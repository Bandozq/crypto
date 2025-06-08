# Coolify Deployment Guide for P2E Games & Airdrops Dashboard

## Quick Setup Checklist

### 1. Access Your Coolify Dashboard
- URL: http://167.86.79.142:8000
- Login with your admin credentials

### 2. Create New Application
1. **Project Creation:**
   - Click "New Project" or use existing project
   - Name: `crypto-dashboard`

2. **Source Configuration:**
   - Source Type: Git Repository
   - Repository: `https://github.com/Bandozq/PO`
   - Branch: `main` (or your deployment branch)

### 3. Application Settings
```
Name: crypto-dashboard
Port: 5000
Build Pack: Dockerfile
```

### 4. Environment Variables
Copy and paste these into Coolify's environment variables section:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:Cnoa@4812//B#@postgres:5432/crypto_dashboard
COINGECKO_API_KEY=CG-hxDqPJ4oH3D2juUTA5ZtjGYf
TWITTER_API_KEY=oP9IUdesFApiHEzmkpBJV2XkJ
TWITTER_API_SECRET=PZb2IOSERDJpAkFlbsF9jzc3MIf5q66n919MSQsGHmkC8LwoGi
TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAFH%2B1wEAAAAA1F2tP2GowEZNDXKS5OBBV8vmoog%3DlCDfqt0n3ozJPm6Kssjpgpwvd5IzJOnkPLw6b2u15ZFTclwEPR
TWITTER_ACCESS_TOKEN=1679236655251705856-p3lK9Enl2kedoUcZ45OFkFqMfTJ2yX
TWITTER_ACCESS_TOKEN_SECRET=eSsS7kWySAygcuCmBuPpaPe11MKg1qOTvyNVyPtEK4vQp
```

### 5. Database Setup
1. **Create PostgreSQL Database:**
   - Go to "Databases" section in Coolify
   - Click "New Database"
   - Choose PostgreSQL 15
   - Configuration:
     ```
     Name: crypto-dashboard-db
     Database: crypto_dashboard
     Username: postgres
     Password: Cnoa@4812//B#
     ```

2. **Update DATABASE_URL:**
   - After database creation, update the DATABASE_URL in your app's environment variables
   - Use the internal connection string provided by Coolify

### 6. Domain Configuration
- **Custom Domain:** https://p2e.rocyber.xyz
- Add domain in Coolify's "Domains" section
- Coolify will automatically handle SSL via Let's Encrypt
- Update your DNS A record to point to your VPS IP

### 7. Build Configuration
Coolify will automatically detect the Dockerfile. Ensure these settings:

```
Build Command: (automatic via Dockerfile)
Start Command: (automatic via Dockerfile)
Health Check URL: /api/stats
```

### 8. Deployment Process
1. Click "Deploy" in Coolify
2. Monitor build logs for any errors
3. Wait for deployment to complete
4. Check application health

### 9. Post-Deployment Steps
1. **Database Migration:**
   ```bash
   # In Coolify's application terminal
   npm run db:push
   ```

2. **Verify Application:**
   - Check health endpoint: `/api/stats`
   - Verify data sources: `/api/data-sources/status`
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
```bash
# Test application health
curl -f http://your-domain/api/stats

# Check database connection
curl -f http://your-domain/api/data-sources/status

# Monitor logs
docker logs crypto-dashboard
```

## Security Notes
- All environment variables are encrypted in Coolify
- SSL certificates are automatically managed
- Database passwords are securely stored
- Regular security updates recommended

## Support
- Coolify Documentation: https://coolify.io/docs
- Application Issues: Check GitHub repository
- Performance Monitoring: Use Coolify's built-in tools
