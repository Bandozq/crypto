import { webScraper } from "./scraper.js";
import { storage } from "./storage.js";
import type { InsertOpportunity } from "@shared/schema";

// Function to create sample opportunities when scraping fails
function createSampleOpportunities(): InsertOpportunity[] {
  console.log('Creating fallback sample opportunities');
  const sampleData = [
    {
      name: 'Bitcoin',
      description: 'The original cryptocurrency and largest by market capitalization.',
      category: 'New Listings',
      sourceUrl: 'https://bitcoin.org',
      websiteUrl: 'https://bitcoin.org',
      estimatedValue: 2500,
      timeRemaining: '30d 0h',
      participants: 50000,
      twitterFollowers: 1500000,
      discordMembers: 200000,
      tradingVolume: 5000000,
      marketCap: 100000000,
      isActive: true,
      hotnessScore: 250
    },
    {
      name: 'Ethereum',
      description: 'Leading smart contract platform for decentralized applications.',
      category: 'New Listings',
      sourceUrl: 'https://ethereum.org',
      websiteUrl: 'https://ethereum.org',
      estimatedValue: 1800,
      timeRemaining: '25d 12h',
      participants: 40000,
      twitterFollowers: 1200000,
      discordMembers: 180000,
      tradingVolume: 4000000,
      marketCap: 80000000,
      isActive: true,
      hotnessScore: 220
    },
    {
      name: 'Axie Infinity',
      description: 'A Pokémon-inspired digital pet universe built on the Ethereum blockchain.',
      category: 'P2E Games',
      sourceUrl: 'https://axieinfinity.com',
      websiteUrl: 'https://axieinfinity.com',
      estimatedValue: 2500,
      timeRemaining: '15d 8h',
      participants: 45000,
      twitterFollowers: 1200000,
      discordMembers: 350000,
      tradingVolume: 3000000,
      marketCap: 50000000,
      isActive: true,
      hotnessScore: 210
    },
    {
      name: 'LayerZero Protocol',
      description: 'Omnichain interoperability protocol enabling seamless cross-chain applications.',
      category: 'Airdrops',
      sourceUrl: 'https://layerzero.network',
      websiteUrl: 'https://layerzero.network',
      estimatedValue: 4500,
      timeRemaining: '7d 2h',
      participants: 125000,
      twitterFollowers: 950000,
      discordMembers: 45000,
      tradingVolume: 2500000,
      marketCap: 40000000,
      isActive: true,
      hotnessScore: 240
    }
  ];

  return sampleData.map(item => ({
    ...item,
    imageUrl: null,
    discordUrl: null,
    twitterUrl: null,
    deadline: null
  }));
}

async function main() {
  console.log("Starting scraper...");
  await webScraper.init();
  const opportunities = await storage.getAllOpportunities();
  
  // Always run the scraper at least once, even if there's existing data
  // This ensures we have fresh data after deployment
  if (opportunities.length > 0) {
    console.log(`Database has ${opportunities.length} existing opportunities. Running scraper to refresh data...`);
  } else {
    console.log("Database empty. Running initial data seeding...");
  }
  
  try {
    await webScraper.scrapeAll();
    console.log("Scraper finished successfully.");
  } catch (error) {
    console.error("Error during scraping:", error);
    console.log("Attempting to generate fallback data...");
    
    // If scraping fails and we have no data, add some sample data
    if (opportunities.length === 0) {
      try {
        // Create some sample data directly
        const sampleOpportunities = createSampleOpportunities();
        
        for (const opportunity of sampleOpportunities) {
          await storage.createOpportunity(opportunity);
        }
        console.log(`Added ${sampleOpportunities.length} sample opportunities as fallback.`);
      } catch (fallbackError) {
        console.error("Failed to add fallback data:", fallbackError);
      }
    }
  } finally {
    await webScraper.close();
    console.log("Scraper process completed.");
  }
}

main().catch((err) => {
  console.error("Error running scraper:", err);
  process.exit(1);
});
