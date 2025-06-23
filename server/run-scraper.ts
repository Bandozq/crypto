import { webScraper } from "./scraper";
import { storage } from "./storage";

async function main() {
  console.log("Starting scraper...");
  await webScraper.init();
  const opportunities = await storage.getAllOpportunities();
  if (opportunities.length > 0) {
    console.log("Database already seeded. Skipping scrape.");
    await webScraper.close();
    return;
  }
  await webScraper.scrapeAll();
  await webScraper.close();
  console.log("Scraper finished.");
}

main().catch((err) => {
  console.error("Error running scraper:", err);
  process.exit(1);
});
