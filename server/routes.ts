import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertOpportunitySchema } from "@shared/schema";
import { 
  setupWebSocketServer, 
  priceAlerts, 
  dataSourceStatus,
  broadcastToClients,
  type PriceAlert 
} from "./websocket-handler.js";
import { historicalTracker } from "./historical-tracker.js";
import { twitterTracker } from "./twitter-tracker.js";
import { logger } from "./logger.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      // Check database connection
      const dbStart = Date.now();
      await storage.getAllOpportunities();
      const dbTime = Date.now() - dbStart;
      
      logger.debug(`Database connection OK (${dbTime}ms)`, "HEALTH");
      res.status(200).json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        database: "connected",
        dbResponseTime: `${dbTime}ms`,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        port: process.env.PORT || 5000
      });
    } catch (error) {
      logger.error("Health check failed - Database connection error", "HEALTH", error);
      res.status(500).json({ 
        status: "error", 
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Simple status endpoint that doesn't require database access
  app.get("/api/status", (_req, res) => {
    res.status(200).json({
      status: "online",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || "1.0.0"
    });
  });

  // Seed data endpoint for emergency data population
  app.post("/api/seed-data", async (_req, res) => {
    try {
      const existingOpportunities = await storage.getAllOpportunities();
      
      if (existingOpportunities.length > 0) {
        return res.json({ 
          message: "Data already exists", 
          count: existingOpportunities.length 
        });
      }

      // Create sample data if none exists
      const sampleOpportunities = [
        {
          name: 'Axie Infinity',
          description: 'A Pokémon-inspired digital pet universe built on the Ethereum blockchain.',
          category: 'P2E Games',
          sourceUrl: 'https://axieinfinity.com',
          websiteUrl: 'https://axieinfinity.com',
          imageUrl: null,
          discordUrl: null,
          twitterUrl: null,
          estimatedValue: 2500,
          timeRemaining: '15d 8h',
          deadline: null,
          participants: 45000,
          hotnessScore: 210,
          twitterFollowers: 1200000,
          discordMembers: 350000,
          tradingVolume: 3000000,
          marketCap: 50000000,
          isActive: true
        },
        {
          name: 'LayerZero Protocol',
          description: 'Omnichain interoperability protocol enabling seamless cross-chain applications.',
          category: 'Airdrops',
          sourceUrl: 'https://layerzero.network',
          websiteUrl: 'https://layerzero.network',
          imageUrl: null,
          discordUrl: null,
          twitterUrl: null,
          estimatedValue: 4500,
          timeRemaining: '7d 2h',
          deadline: null,
          participants: 125000,
          hotnessScore: 240,
          twitterFollowers: 950000,
          discordMembers: 45000,
          tradingVolume: 2500000,
          marketCap: 40000000,
          isActive: true
        },
        {
          name: 'The Sandbox',
          description: 'A virtual world where players can build, own, and monetize their gaming experiences.',
          category: 'P2E Games',
          sourceUrl: 'https://www.sandbox.game',
          websiteUrl: 'https://www.sandbox.game',
          imageUrl: null,
          discordUrl: null,
          twitterUrl: null,
          estimatedValue: 1800,
          timeRemaining: '22d 14h',
          deadline: null,
          participants: 32000,
          hotnessScore: 190,
          twitterFollowers: 800000,
          discordMembers: 120000,
          tradingVolume: 2000000,
          marketCap: 35000000,
          isActive: true
        },
        {
          name: 'zkSync Era',
          description: 'Layer 2 scaling solution for Ethereum with zero-knowledge proofs.',
          category: 'Airdrops',
          sourceUrl: 'https://zksync.io',
          websiteUrl: 'https://zksync.io',
          imageUrl: null,
          discordUrl: null,
          twitterUrl: null,
          estimatedValue: 3800,
          timeRemaining: '12d 18h',
          deadline: null,
          participants: 89000,
          hotnessScore: 220,
          twitterFollowers: 720000,
          discordMembers: 35000,
          tradingVolume: 1800000,
          marketCap: 30000000,
          isActive: true
        }
      ];

      let createdCount = 0;
      for (const opportunity of sampleOpportunities) {
        try {
          await storage.createOpportunity(opportunity);
          createdCount++;
        } catch (error) {
          console.error('Error creating sample opportunity:', error);
        }
      }

      res.json({ 
        message: "Sample data seeded successfully", 
        count: createdCount 
      });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  // Get all opportunities
  app.get("/api/opportunities", async (req, res) => {
    try {
      const { category, timeFrame, search, limit } = req.query;
      
      logger.apiRequest('GET', '/api/opportunities', { category, timeFrame, search, limit });
      
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

      if (limit) {
        opportunities = opportunities.slice(0, parseInt(limit as string));
      }

      logger.debug(`Returning ${opportunities.length} opportunities`, "API");
      res.json(opportunities);
    } catch (error) {
      logger.error("Error fetching opportunities", "API", error);
      res.status(500).json({ 
        message: "Failed to fetch opportunities",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get hot opportunities
  app.get("/api/opportunities/hot", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 4;
      const hotOpportunities = await storage.getHotOpportunities(limit);
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
      const allOpportunities = await storage.getAllOpportunities();
      const todayOpportunities = await storage.getOpportunitiesByTimeFrame(24);
      
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
