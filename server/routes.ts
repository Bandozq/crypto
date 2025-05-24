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

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the scraping scheduler
  initializeScheduler();

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

  const httpServer = createServer(app);

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    wsClients.add(ws);
    
    // Send initial data source status
    ws.send(JSON.stringify({
      type: 'data_sources_status',
      data: dataSourceStatus
    }));
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  console.log('WebSocket server enabled for real-time updates');

  return httpServer;
}
