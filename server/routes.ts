import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOpportunitySchema } from "@shared/schema";
import { initializeScheduler } from "./scheduler";
import { 
  setupWebSocketServer, 
  priceAlerts, 
  dataSourceStatus,
  broadcastToClients,
  type PriceAlert 
} from "./websocket-handler";
import { historicalTracker } from "./historical-tracker";
import { twitterTracker } from "./twitter-tracker";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the scraping scheduler
  initializeScheduler();
  
  // Initialize Twitter tracking for social sentiment
  try {
    await twitterTracker.startTracking();
    console.log('Twitter social sentiment tracking initialized');
  } catch (error) {
    console.log('Twitter tracking disabled:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Get all opportunities
  app.get("/api/opportunities", async (req, res) => {
    try {
      const { category, timeFrame, search, limit } = req.query;
      
      let opportunities;
      
      if (search) {
        opportunities = await storage.searchOpportunities(search as string);
      } else if (category && category !== 'all') {
        opportunities = await storage.getOpportunitiesByCategory(category as string);
      } else if (timeFrame) {
        const hours = timeFrame === '1h' ? 1 : timeFrame === '6h' ? 6 : timeFrame === '24h' ? 24 : 168;
        opportunities = await storage.getOpportunitiesByTimeFrame(hours);
      } else {
        opportunities = await storage.getAllOpportunities();
      }

      // Filter out mainstream cryptocurrencies (Bitcoin and Ethereum)
      opportunities = opportunities.filter(opp => {
        const name = opp.name.toLowerCase();
        return !name.includes('bitcoin') && 
               !name.includes('ethereum') &&
               name !== 'btc' &&
               name !== 'eth';
      });

      if (limit) {
        opportunities = opportunities.slice(0, parseInt(limit as string));
      }

      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  // Get hot opportunities
  app.get("/api/opportunities/hot", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      let hotOpportunities = await storage.getHotOpportunities(limit * 2); // Get more to account for filtering
      
      // Filter out mainstream cryptocurrencies (Bitcoin and Ethereum)
      hotOpportunities = hotOpportunities.filter(opp => {
        const name = opp.name.toLowerCase();
        return !name.includes('bitcoin') && 
               !name.includes('ethereum') &&
               name !== 'btc' &&
               name !== 'eth';
      });
      
      // Take the requested number after filtering
      hotOpportunities = hotOpportunities.slice(0, limit);
      
      res.json(hotOpportunities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hot opportunities" });
    }
  });

  // Get single opportunity
  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  });

  // Create new opportunity (admin endpoint)
  app.post("/api/opportunities", async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      res.status(400).json({ message: "Invalid opportunity data" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      let allOpportunities = await storage.getAllOpportunities();
      let todayOpportunities = await storage.getOpportunitiesByTimeFrame(24);
      
      // Filter out mainstream cryptocurrencies (Bitcoin and Ethereum) from stats
      const filterMainstream = (opportunities: any[]) => opportunities.filter(opp => {
        const name = opp.name.toLowerCase();
        return !name.includes('bitcoin') && 
               !name.includes('ethereum') &&
               name !== 'btc' &&
               name !== 'eth';
      });
      
      allOpportunities = filterMainstream(allOpportunities);
      todayOpportunities = filterMainstream(todayOpportunities);
      
      const stats = {
        totalOpportunities: allOpportunities.length,
        activeAirdrops: allOpportunities.filter(opp => opp.category === 'Airdrops').length,
        newListings: todayOpportunities.filter(opp => opp.category === 'New Listings').length,
        p2eGames: allOpportunities.filter(opp => opp.category === 'P2E Games').length,
        totalValue: allOpportunities.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0),
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Add price alerts API endpoints
  app.post("/api/alerts", async (req, res) => {
    try {
      const { symbol, targetPrice, condition } = req.body;
      const userId = "user1"; // For demo - in real app, get from session
      
      const alertKey = `${userId}_${symbol}`;
      const existingAlerts = priceAlerts.get(alertKey) || [];
      
      const newAlert = {
        userId,
        symbol,
        targetPrice: parseFloat(targetPrice),
        condition,
        isActive: true
      };
      
      existingAlerts.push(newAlert);
      priceAlerts.set(alertKey, existingAlerts);
      
      res.json({ success: true, alert: newAlert });
    } catch (error) {
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = "user1"; // For demo
      const userAlerts: PriceAlert[] = [];
      
      for (const [key, alerts] of Array.from(priceAlerts.entries())) {
        if (key.startsWith(userId)) {
          userAlerts.push(...alerts.filter((alert: PriceAlert) => alert.isActive));
        }
      }
      
      res.json(userAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/data-sources/status", async (req, res) => {
    res.json(dataSourceStatus);
  });

  // Enhanced Analytics and Historical Data endpoints
  app.get("/api/analytics/velocity", async (req, res) => {
    try {
      const timeframe = parseInt(req.query.hours as string) || 24;
      const velocity = await historicalTracker.getOpportunityVelocity(timeframe);
      res.json(velocity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunity velocity" });
    }
  });

  app.get("/api/analytics/hotness-progression", async (_req, res) => {
    try {
      const progression = await historicalTracker.getHotnessProgression();
      res.json(progression);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotness progression" });
    }
  });

  app.get("/api/analytics/source-correlation", async (_req, res) => {
    try {
      const correlation = await historicalTracker.getSourceCorrelation();
      res.json(correlation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch source correlation" });
    }
  });

  app.get("/api/analytics/trends", async (req, res) => {
    try {
      const { timeframe = '30d' } = req.query;
      const trends = await historicalTracker.getCategoryTrends(timeframe as string);
      res.json(trends);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });

  app.get("/api/analytics/success-rates", async (req, res) => {
    try {
      const analytics = await historicalTracker.getSuccessRateAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch success rates" });
    }
  });

  app.get("/api/opportunities/:id/history", async (req, res) => {
    try {
      const { id } = req.params;
      const { days = '30' } = req.query;
      const history = await historicalTracker.getOpportunityTrend(parseInt(id), parseInt(days as string));
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunity history" });
    }
  });

  // Twitter social sentiment endpoints
  app.get("/api/social/sentiment", async (req, res) => {
    try {
      const sentiment = await twitterTracker.getTrendingSentiment();
      res.json(sentiment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social sentiment data" });
    }
  });

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  setupWebSocketServer(httpServer);

  return httpServer;
}
