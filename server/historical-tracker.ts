import { db } from "./db";
import { opportunities } from "@shared/schema";
import { eq, sql, gte } from "drizzle-orm";
import { storage } from "./storage";

// Historical data tracking for opportunity performance
export class HistoricalTracker {
  
  // Track opportunity velocity by category - how fast new opportunities appear
  async getOpportunityVelocity(timeframeHours: number = 24) {
    try {
      const allOpportunities = await storage.getAllOpportunities();
      const cutoffTime = new Date(Date.now() - (timeframeHours * 60 * 60 * 1000));
      
      // Group by category and count new opportunities
      const categoryVelocity = new Map<string, { 
        count: number; 
        avgHotness: number; 
        sources: Set<string>;
        totalValue: number;
      }>();
      
      allOpportunities.forEach(opp => {
        const createdAt = new Date(opp.createdAt || 0);
        if (createdAt > cutoffTime) {
          const category = opp.category || 'Unknown';
          const existing = categoryVelocity.get(category) || { 
            count: 0, 
            avgHotness: 0, 
            sources: new Set(),
            totalValue: 0 
          };
          
          existing.count += 1;
          existing.avgHotness = ((existing.avgHotness * (existing.count - 1)) + (opp.hotnessScore || 0)) / existing.count;
          existing.totalValue += opp.estimatedValue || 0;
          
          // Track which source discovered this opportunity first
          if (opp.source) existing.sources.add(opp.source);
          
          categoryVelocity.set(category, existing);
        }
      });
      
      return Array.from(categoryVelocity.entries()).map(([category, data]) => ({
        category,
        newOpportunities: data.count,
        velocityPerHour: Number((data.count / timeframeHours).toFixed(2)),
        averageHotness: Math.round(data.avgHotness),
        totalEstimatedValue: data.totalValue,
        leadingSources: Array.from(data.sources),
        trend: data.count > 5 ? 'accelerating' : data.count > 2 ? 'steady' : 'slow'
      })).sort((a, b) => b.velocityPerHour - a.velocityPerHour);
      
    } catch (error) {
      console.error('Failed to calculate opportunity velocity:', error);
      return [];
    }
  }

  // Track hotness score progression over time for all opportunities
  async getHotnessProgression(days: number = 7) {
    try {
      const allOpportunities = await storage.getAllOpportunities();
      
      // Group opportunities by hotness score ranges
      const scoreRanges = {
        'Very Hot (80-100)': allOpportunities.filter(o => (o.hotnessScore || 0) >= 80).length,
        'Hot (60-79)': allOpportunities.filter(o => (o.hotnessScore || 0) >= 60 && (o.hotnessScore || 0) < 80).length,
        'Warm (40-59)': allOpportunities.filter(o => (o.hotnessScore || 0) >= 40 && (o.hotnessScore || 0) < 60).length,
        'Cool (0-39)': allOpportunities.filter(o => (o.hotnessScore || 0) < 40).length
      };

      // Calculate trends by category
      const categoryHotness = new Map<string, { avgScore: number; count: number; topScore: number }>();
      
      allOpportunities.forEach(opp => {
        const category = opp.category || 'Unknown';
        const existing = categoryHotness.get(category) || { avgScore: 0, count: 0, topScore: 0 };
        
        existing.count += 1;
        existing.avgScore = ((existing.avgScore * (existing.count - 1)) + (opp.hotnessScore || 0)) / existing.count;
        existing.topScore = Math.max(existing.topScore, opp.hotnessScore || 0);
        
        categoryHotness.set(category, existing);
      });

      return {
        scoreDistribution: scoreRanges,
        categoryHotness: Array.from(categoryHotness.entries()).map(([category, data]) => ({
          category,
          averageHotness: Math.round(data.avgScore),
          topHotness: data.topScore,
          opportunityCount: data.count
        })).sort((a, b) => b.averageHotness - a.averageHotness),
        totalOpportunities: allOpportunities.length,
        averageGlobalHotness: Math.round(
          allOpportunities.reduce((sum, opp) => sum + (opp.hotnessScore || 0), 0) / allOpportunities.length
        )
      };
      
    } catch (error) {
      console.error('Failed to get hotness progression:', error);
      return null;
    }
  }

  // Analyze source correlation - which sources predict the hottest opportunities first
  async getSourceCorrelation() {
    try {
      const allOpportunities = await storage.getAllOpportunities();
      
      // Group by source and analyze performance
      const sourcePerformance = new Map<string, {
        count: number;
        avgHotness: number;
        topOpportunities: any[];
        categories: Set<string>;
        recentCount: number;
      }>();

      const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));

      allOpportunities.forEach(opp => {
        const source = opp.source || 'Unknown';
        const existing = sourcePerformance.get(source) || {
          count: 0,
          avgHotness: 0,
          topOpportunities: [],
          categories: new Set(),
          recentCount: 0
        };

        existing.count += 1;
        existing.avgHotness = ((existing.avgHotness * (existing.count - 1)) + (opp.hotnessScore || 0)) / existing.count;
        
        if (opp.category) existing.categories.add(opp.category);
        
        // Track recent discoveries
        const createdAt = new Date(opp.createdAt || 0);
        if (createdAt > last24Hours) {
          existing.recentCount += 1;
        }

        // Keep track of top opportunities from this source
        existing.topOpportunities.push({
          name: opp.name,
          hotness: opp.hotnessScore || 0,
          category: opp.category
        });
        existing.topOpportunities.sort((a, b) => b.hotness - a.hotness);
        existing.topOpportunities = existing.topOpportunities.slice(0, 3); // Keep top 3

        sourcePerformance.set(source, existing);
      });

      return Array.from(sourcePerformance.entries()).map(([source, data]) => ({
        source,
        totalOpportunities: data.count,
        averageHotness: Math.round(data.avgHotness),
        recentDiscoveries: data.recentCount,
        discoveryRate: Number((data.recentCount / 24).toFixed(2)), // per hour
        categories: Array.from(data.categories),
        topOpportunities: data.topOpportunities,
        performance: data.avgHotness >= 70 ? 'excellent' : 
                    data.avgHotness >= 50 ? 'good' : 
                    data.avgHotness >= 30 ? 'fair' : 'poor'
      })).sort((a, b) => b.averageHotness - a.averageHotness);

    } catch (error) {
      console.error('Failed to get source correlation:', error);
      return [];
    }
  }
  
  // Track opportunity performance over time
  async trackOpportunityPerformance(opportunityId: number) {
    try {
      const opportunity = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1);

      if (opportunity.length === 0) return;

      const opp = opportunity[0];
      
      // Store historical snapshot (in real app, use separate historical table)
      const historicalData = {
        opportunityId,
        hotnessScore: opp.hotnessScore,
        estimatedValue: opp.estimatedValue,
        timestamp: new Date().toISOString(),
        category: opp.category
      };

      // For demo, we'll store in localStorage on client side
      // In production, this would be a separate database table
      console.log('Historical tracking:', historicalData);
      
      return historicalData;
    } catch (error) {
      console.error('Failed to track historical data:', error);
    }
  }

  // Analyze trends for a specific opportunity
  async getOpportunityTrend(opportunityId: number, days: number = 30) {
    // In real implementation, query historical table
    // For demo, return mock trend data based on current opportunity
    try {
      const opportunity = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, opportunityId))
        .limit(1);

      if (opportunity.length === 0) return [];

      const opp = opportunity[0];
      const trendData = [];
      
      // Generate trend data for the last N days
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate historical hotness score variations
        const baseScore = opp.hotnessScore || 100;
        const variation = (Math.random() - 0.5) * 50;
        const historicalScore = Math.max(0, baseScore + variation);
        
        trendData.push({
          date: date.toISOString().split('T')[0],
          hotnessScore: Math.round(historicalScore),
          estimatedValue: opp.estimatedValue || 0,
          searchVolume: Math.floor(Math.random() * 1000) + 100
        });
      }
      
      return trendData;
    } catch (error) {
      console.error('Failed to get opportunity trend:', error);
      return [];
    }
  }

  // Get category performance trends
  async getCategoryTrends(timeframe: string = '30d') {
    try {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      
      // Get current category distribution
      const categoryStats = await db
        .select({
          category: opportunities.category,
          count: sql<number>`count(*)`,
          avgHotness: sql<number>`avg(${opportunities.hotnessScore})`,
          totalValue: sql<number>`sum(${opportunities.estimatedValue})`
        })
        .from(opportunities)
        .groupBy(opportunities.category);

      // Generate trend data for each category
      const trends = categoryStats.map(stat => {
        const trendPoints = [];
        for (let i = days; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          trendPoints.push({
            date: date.toISOString().split('T')[0],
            category: stat.category,
            count: Math.floor(Number(stat.count) * (0.8 + Math.random() * 0.4)),
            avgHotness: Number(stat.avgHotness) + (Math.random() - 0.5) * 20,
            searchInterest: Math.floor(Math.random() * 100) + 20
          });
        }
        return {
          category: stat.category,
          currentCount: Number(stat.count),
          currentAvgHotness: Number(stat.avgHotness),
          trend: trendPoints
        };
      });

      return trends;
    } catch (error) {
      console.error('Failed to get category trends:', error);
      return [];
    }
  }

  // Simulate Google Trends integration
  async getGoogleTrendsData(keywords: string[], timeframe: string = '30d') {
    // In real implementation, this would call Google Trends API
    // For demo, simulate trend data based on current opportunities
    
    const trends = keywords.map(keyword => {
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      const dataPoints = [];
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Simulate search interest (0-100 scale like Google Trends)
        const baseInterest = Math.random() * 60 + 20;
        const variation = (Math.random() - 0.5) * 20;
        const interest = Math.max(0, Math.min(100, baseInterest + variation));
        
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          searchInterest: Math.round(interest),
          relatedQueries: Math.floor(Math.random() * 500) + 100
        });
      }
      
      return {
        keyword,
        data: dataPoints,
        avgInterest: dataPoints.reduce((sum, point) => sum + point.searchInterest, 0) / dataPoints.length,
        trend: dataPoints[dataPoints.length - 1].searchInterest > dataPoints[0].searchInterest ? 'up' : 'down'
      };
    });
    
    return trends;
  }

  // Get success rate analytics
  async getSuccessRateAnalytics() {
    try {
      // In real implementation, track which opportunities led to profitable outcomes
      // For demo, simulate success rates based on hotness scores
      
      const allOpportunities = await db.select().from(opportunities);
      
      const analytics = {
        totalTracked: allOpportunities.length,
        successfulOutcomes: Math.floor(allOpportunities.length * 0.65), // 65% mock success rate
        averageROI: 127, // Mock average ROI percentage
        topPerformingCategory: 'P2E Games',
        categorySuccessRates: {
          'P2E Games': 72,
          'Airdrops': 58,
          'New Listings': 45,
          'DeFi': 68,
          'NFT': 55
        },
        monthlyGrowth: 23 // Mock monthly growth percentage
      };
      
      return analytics;
    } catch (error) {
      console.error('Failed to get success rate analytics:', error);
      return null;
    }
  }
}

export const historicalTracker = new HistoricalTracker();