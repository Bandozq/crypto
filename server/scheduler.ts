import cron from 'node-cron';
import { webScraper } from './scraper';

export function initializeScheduler() {
  console.log('Initializing scraping scheduler...');

  // Initialize scraper
  webScraper.init();

  // Run initial scrape after 5 seconds
  setTimeout(() => {
    console.log('Running initial scrape...');
    webScraper.scrapeAll();
  }, 5000);

  // Schedule scraping every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running scheduled scrape...');
    try {
      await webScraper.scrapeAll();
    } catch (error) {
      console.error('Scheduled scrape failed:', error);
    }
  });

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    console.log('Shutting down scraper...');
    await webScraper.close();
    process.exit(0);
  });

  console.log('Scheduler initialized - scraping every 15 minutes');
}
