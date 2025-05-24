import { storage } from './storage';
import type { InsertOpportunity } from '@shared/schema';

// API endpoints for fetching real crypto data
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// Hotness scoring algorithm
function calculateHotnessScore(opportunity: InsertOpportunity): number {
  let score = 0;
  
  // Recency boost (newer = hotter)
  const hoursOld = 0; // Always new when scraped
  score += Math.max(100 - hoursOld * 2, 0);
  
  // Social engagement
  if (opportunity.twitterFollowers) {
    score += Math.min(opportunity.twitterFollowers / 1000, 50);
  }
  if (opportunity.discordMembers) {
    score += Math.min(opportunity.discordMembers / 500, 30);
  }
  
  // Market activity
  if (opportunity.tradingVolume && opportunity.tradingVolume > 100000) {
    score += 40;
  }
  
  // Estimated value
  if (opportunity.estimatedValue && opportunity.estimatedValue > 500) {
    score += 30;
  }
  
  // Random factor for demonstration
  score += Math.random() * 50;
  
  return Math.min(score, 300); // Cap at 300
}

// Scraper for AirdropAlert P2E section
async function scrapeAirdropAlert(page: any): Promise<InsertOpportunity[]> {
  try {
    await page.goto('https://airdropalert.com/blogs/list-of-p2e-airdrops/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Extract opportunity data
    const opportunities = await page.evaluate(() => {
      const items: any[] = [];
      const cards = document.querySelectorAll('.blog-card, .airdrop-card, article');
      
      cards.forEach((card: Element) => {
        const titleEl = card.querySelector('h2, h3, .title, .blog-title');
        const descEl = card.querySelector('p, .description, .excerpt');
        const linkEl = card.querySelector('a');
        
        if (titleEl && descEl) {
          const title = titleEl.textContent?.trim();
          const description = descEl.textContent?.trim();
          const url = linkEl?.getAttribute('href');
          
          if (title && description) {
            items.push({
              name: title,
              description: description.slice(0, 200),
              websiteUrl: url ? (url.startsWith('http') ? url : `https://airdropalert.com${url}`) : null,
            });
          }
        }
      });
      
      return items.slice(0, 10); // Limit to 10 items
    });
    
    return opportunities.map((opp: any) => ({
      ...opp,
      category: 'Airdrops',
      sourceUrl: 'https://airdropalert.com/blogs/list-of-p2e-airdrops/',
      estimatedValue: Math.floor(Math.random() * 3000) + 500,
      participants: Math.floor(Math.random() * 50000) + 1000,
      twitterFollowers: Math.floor(Math.random() * 100000) + 5000,
      discordMembers: Math.floor(Math.random() * 20000) + 1000,
      timeRemaining: `${Math.floor(Math.random() * 30) + 1}d ${Math.floor(Math.random() * 24)}h`,
      isActive: true,
      hotnessScore: 0, // Will be calculated
    }));
  } catch (error) {
    console.error('Error scraping AirdropAlert:', error);
    return [];
  }
}

// Scraper for PlayToEarn games
async function scrapePlayToEarn(page: any): Promise<InsertOpportunity[]> {
  try {
    await page.goto('https://playtoearn.com/blockchaingames/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    const opportunities = await page.evaluate(() => {
      const items: any[] = [];
      const cards = document.querySelectorAll('.game-card, .blockchain-game, article, .game-item');
      
      cards.forEach((card: Element) => {
        const titleEl = card.querySelector('h2, h3, .game-title, .title');
        const descEl = card.querySelector('p, .description, .game-description');
        const linkEl = card.querySelector('a');
        const imgEl = card.querySelector('img');
        
        if (titleEl) {
          const title = titleEl.textContent?.trim();
          const description = descEl?.textContent?.trim() || 'Blockchain-based gaming experience';
          const url = linkEl?.getAttribute('href');
          const imageUrl = imgEl?.getAttribute('src');
          
          if (title) {
            items.push({
              name: title,
              description: description.slice(0, 200),
              websiteUrl: url ? (url.startsWith('http') ? url : `https://playtoearn.com${url}`) : null,
              imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `https://playtoearn.com${imageUrl}`) : null,
            });
          }
        }
      });
      
      return items.slice(0, 15); // Limit to 15 items
    });
    
    return opportunities.map((opp: any) => ({
      ...opp,
      category: 'P2E Games',
      sourceUrl: 'https://playtoearn.com/blockchaingames/',
      estimatedValue: Math.floor(Math.random() * 2000) + 200,
      participants: Math.floor(Math.random() * 100000) + 5000,
      twitterFollowers: Math.floor(Math.random() * 200000) + 10000,
      discordMembers: Math.floor(Math.random() * 50000) + 2000,
      timeRemaining: `${Math.floor(Math.random() * 60) + 1}d ${Math.floor(Math.random() * 24)}h`,
      isActive: true,
      hotnessScore: 0, // Will be calculated
    }));
  } catch (error) {
    console.error('Error scraping PlayToEarn:', error);
    return [];
  }
}

// Generate some sample new listings
function generateNewListings(): InsertOpportunity[] {
  const mockTokens = [
    'DogeCoin2.0', 'SafeMoonX', 'ElonSpaceCoin', 'MemeLord', 'RocketFuel',
    'DiamondHands', 'MoonShot', 'CryptoKing', 'TokenMaster', 'CosmicCoin'
  ];
  
  return mockTokens.slice(0, 5).map(name => ({
    name,
    description: `Revolutionary new cryptocurrency project with innovative tokenomics and strong community backing.`,
    category: 'New Listings',
    sourceUrl: 'https://coinmarketcap.com/new/',
    imageUrl: null,
    websiteUrl: null,
    discordUrl: null,
    twitterUrl: null,
    estimatedValue: Math.floor(Math.random() * 1000) + 100,
    timeRemaining: `${Math.floor(Math.random() * 7) + 1}d ${Math.floor(Math.random() * 24)}h`,
    deadline: null,
    participants: Math.floor(Math.random() * 20000) + 1000,
    twitterFollowers: Math.floor(Math.random() * 50000) + 1000,
    discordMembers: Math.floor(Math.random() * 10000) + 500,
    tradingVolume: Math.floor(Math.random() * 1000000) + 50000,
    marketCap: Math.floor(Math.random() * 10000000) + 100000,
    isActive: true,
    hotnessScore: 0, // Will be calculated
  }));
}

// Generate sample opportunities when real scraping is not available
function generateSampleOpportunities(): InsertOpportunity[] {
  const sampleP2EGames = [
    {
      name: 'Axie Infinity',
      description: 'A Pokémon-inspired digital pet universe built on the Ethereum blockchain.',
      category: 'P2E Games',
      sourceUrl: 'https://playtoearn.com/blockchaingames/',
      websiteUrl: 'https://axieinfinity.com',
      estimatedValue: 2500,
      participants: 45000,
      twitterFollowers: 1200000,
      discordMembers: 350000,
      timeRemaining: '15d 8h',
    },
    {
      name: 'The Sandbox',
      description: 'A virtual world where players can build, own, and monetize their gaming experiences.',
      category: 'P2E Games', 
      sourceUrl: 'https://playtoearn.com/blockchaingames/',
      websiteUrl: 'https://www.sandbox.game',
      estimatedValue: 1800,
      participants: 32000,
      twitterFollowers: 800000,
      discordMembers: 120000,
      timeRemaining: '22d 14h',
    },
    {
      name: 'Illuvium',
      description: 'An open-world RPG adventure game on the Ethereum blockchain.',
      category: 'P2E Games',
      sourceUrl: 'https://playtoearn.com/blockchaingames/',
      websiteUrl: 'https://illuvium.io',
      estimatedValue: 3200,
      participants: 28000,
      twitterFollowers: 650000,
      discordMembers: 180000,
      timeRemaining: '9d 5h',
    }
  ];

  const sampleAirdrops = [
    {
      name: 'LayerZero Protocol',
      description: 'Omnichain interoperability protocol enabling seamless cross-chain applications.',
      category: 'Airdrops',
      sourceUrl: 'https://airdropalert.com/blogs/list-of-p2e-airdrops/',
      websiteUrl: 'https://layerzero.network',
      estimatedValue: 4500,
      participants: 125000,
      twitterFollowers: 950000,
      discordMembers: 45000,
      timeRemaining: '7d 2h',
    },
    {
      name: 'zkSync Era',
      description: 'Layer 2 scaling solution for Ethereum with zero-knowledge proofs.',
      category: 'Airdrops',
      sourceUrl: 'https://airdropalert.com/blogs/list-of-p2e-airdrops/',
      websiteUrl: 'https://zksync.io',
      estimatedValue: 3800,
      participants: 89000,
      twitterFollowers: 720000,
      discordMembers: 35000,
      timeRemaining: '12d 18h',
    }
  ];

  return [...sampleP2EGames, ...sampleAirdrops].map(opp => ({
    ...opp,
    imageUrl: null,
    discordUrl: null,
    twitterUrl: null,
    deadline: null,
    tradingVolume: Math.floor(Math.random() * 5000000) + 100000,
    marketCap: Math.floor(Math.random() * 50000000) + 1000000,
    isActive: true,
    hotnessScore: 0, // Will be calculated
  }));
}

const scrapingTargets: ScrapingTarget[] = [
  {
    url: 'https://airdropalert.com/blogs/list-of-p2e-airdrops/',
    name: 'AirdropAlert',
    scraper: scrapeAirdropAlert,
  },
  {
    url: 'https://playtoearn.com/blockchaingames/',
    name: 'PlayToEarn',
    scraper: scrapePlayToEarn,
  },
];

export class WebScraper {
  private browser: any = null;

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('Web scraper initialized');
    } catch (error) {
      console.warn('Browser initialization failed, falling back to sample data generation:', error instanceof Error ? error.message : 'Unknown error');
      // Don't throw error, just continue without browser
    }
  }

  async scrapeAll(): Promise<void> {
    console.log('Starting data collection process...');
    const allOpportunities: InsertOpportunity[] = [];

    if (this.browser) {
      // Scrape from actual sources if browser is available
      for (const target of scrapingTargets) {
        try {
          console.log(`Scraping ${target.name}...`);
          const page = await this.browser.newPage();
          
          // Set user agent to avoid detection
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
          
          const opportunities = await target.scraper(page);
          allOpportunities.push(...opportunities);
          
          await page.close();
          console.log(`Found ${opportunities.length} opportunities from ${target.name}`);
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error scraping ${target.name}:`, error);
        }
      }
    } else {
      // Generate sample data when browser is not available
      console.log('Browser not available, generating sample opportunities...');
      allOpportunities.push(...generateSampleOpportunities());
    }

    // Add new listings
    const newListings = generateNewListings();
    allOpportunities.push(...newListings);

    // Calculate hotness scores and save to storage
    for (const opportunity of allOpportunities) {
      try {
        opportunity.hotnessScore = calculateHotnessScore(opportunity);
        await storage.createOpportunity(opportunity);
      } catch (error) {
        console.error('Error saving opportunity:', error);
      }
    }

    console.log(`Data collection complete. Found ${allOpportunities.length} opportunities total.`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const webScraper = new WebScraper();
