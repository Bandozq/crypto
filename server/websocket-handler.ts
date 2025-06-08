import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// WebSocket clients and price alerts storage
export const wsClients = new Set<WebSocket>();

export interface PriceAlert {
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

export const priceAlerts = new Map<string, PriceAlert[]>();

// Data source status tracking
export const dataSourceStatus = {
  coingecko: { active: true, lastUpdate: new Date().toISOString(), error: null },
  coinmarketcap: { active: false, lastUpdate: null, error: 'API Key Required - 403 Forbidden' },
  twitter: { active: true, lastUpdate: new Date().toISOString(), error: null },
  airdropalert: { active: true, lastUpdate: new Date().toISOString(), error: null },
  cryptonews: { active: true, lastUpdate: new Date().toISOString(), error: null },
  nftevening: { active: true, lastUpdate: new Date().toISOString(), error: null },
  playtoearn: { active: true, lastUpdate: new Date().toISOString(), error: null }
};

// Helper function to broadcast to all WebSocket clients
export function broadcastToClients(message: any) {
  const messageStr = JSON.stringify(message);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Setup WebSocket server
export function setupWebSocketServer(httpServer: Server) {
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
  return wss;
}

// Function to update data source status
export function updateDataSourceStatus(source: string, status: { active: boolean, error?: string | null }) {
  if (dataSourceStatus[source as keyof typeof dataSourceStatus]) {
    dataSourceStatus[source as keyof typeof dataSourceStatus] = {
      ...dataSourceStatus[source as keyof typeof dataSourceStatus],
      ...status,
      lastUpdate: new Date()
    };
    
    // Broadcast status update to all clients
    broadcastToClients({
      type: 'data_source_update',
      source,
      status: dataSourceStatus[source as keyof typeof dataSourceStatus]
    });
  }
}