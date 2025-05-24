import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./storage";
import { insertOpportunitySchema } from "@shared/schema";
import { initializeScheduler } from "./scheduler";

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

  const httpServer = createServer(app);

  // Setup WebSocket for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer,
    perMessageDeflate: false
  });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('error', (error) => {
      console.log('WebSocket error:', error);
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });

    // Send initial data safely
    storage.getAllOpportunities().then(opportunities => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(JSON.stringify({
            type: 'opportunities_update',
            data: opportunities
          }));
        } catch (error) {
          console.error('Error sending initial data:', error);
        }
      }
    }).catch(error => {
      console.error('Error fetching initial opportunities:', error);
    });
  });

  // Broadcast updates to all connected clients every 30 seconds
  setInterval(async () => {
    if (wss.clients.size > 0) {
      try {
        const opportunities = await storage.getAllOpportunities();
        const stats = {
          totalOpportunities: opportunities.length,
          activeAirdrops: opportunities.filter(opp => opp.category === 'Airdrops').length,
          newListings: opportunities.filter(opp => opp.category === 'New Listings').length,
        };

        const message = JSON.stringify({
          type: 'live_update',
          data: { opportunities, stats }
        });

        wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            try {
              client.send(message);
            } catch (error) {
              console.error('Error sending to client:', error);
            }
          }
        });
      } catch (error) {
        console.error('Error broadcasting updates:', error);
      }
    }
  }, 30000);

  return httpServer;
}
