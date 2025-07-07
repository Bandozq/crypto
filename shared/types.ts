// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// CoinGecko API Types
export interface CoinGeckoTrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    large: string;
    price_btc: number;
  };
}

export interface CoinGeckoTrendingResponse {
  coins: CoinGeckoTrendingCoin[];
}

// CoinMarketCap API Types
export interface CoinMarketCapCoin {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      market_cap: number;
      volume_24h: number;
    };
  };
}

export interface CoinMarketCapResponse {
  data: CoinMarketCapCoin[];
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface PriceAlert {
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt?: Date;
}

export interface DataSourceStatus {
  active: boolean;
  lastUpdate: Date;
  error: string | null;
}

// Scraping Types
export interface ScrapedGameData {
  name: string;
  description: string;
  url?: string;
  source: string;
}

export interface ScrapingResult {
  success: boolean;
  data: ScrapedGameData[];
  error?: string;
  source: string;
}

// Twitter API Types
export interface TwitterTweet {
  id: string;
  text: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  created_at: string;
  author_id: string;
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
  };
}

export interface TwitterResponse {
  data: TwitterTweet[];
  includes?: {
    users: TwitterUser[];
  };
}

// Analytics Types
export interface OpportunityVelocity {
  timeframe: string;
  newOpportunities: number;
  totalOpportunities: number;
  averageHotness: number;
}

export interface HotnessProgression {
  opportunityId: number;
  hotnessHistory: Array<{
    timestamp: Date;
    score: number;
  }>;
}

export interface SourceCorrelation {
  source: string;
  successRate: number;
  averageValue: number;
  totalOpportunities: number;
}

export interface CategoryTrend {
  category: string;
  timeframe: string;
  growth: number;
  averageValue: number;
  topOpportunities: Array<{
    id: number;
    name: string;
    hotnessScore: number;
  }>;
}

// HTTP Request Types
export interface RequestWithUser extends Request {
  user?: {
    id: number;
    username: string;
  };
}

// Error Types
export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database?: 'connected' | 'disconnected';
  dbResponseTime?: string;
  uptime?: number;
  memory?: NodeJS.MemoryUsage;
  port?: string | number;
}

// Wallet Integration Types
export interface WalletProvider {
  name: string;
  isInstalled: boolean;
  connect: () => Promise<string[]>;
  disconnect: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
}

export interface WalletConnection {
  address: string;
  provider: string;
  chainId: number;
  isConnected: boolean;
}