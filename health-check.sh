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
