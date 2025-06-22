import cron from 'node-cron';
import { webScraper } from './scraper';

export function initializeScheduler() {
  console.log('Initializing scraping scheduler...');

  // Initialize scraper
  webScraper.init();

  // Schedule scraping every 15 minutes, but wait 60 seconds before the first run
  setTimeout(() => {
    cron.schedule('*/15 * * * *', async () => {
      console.log('Running scheduled scrape...');
      try {
        await webScraper.scrapeAll();
      } catch (error) {
        console.error('Scheduled scrape failed:', error);
      }
    });
  }, 60000); // 60 seconds

  // Cleanup on process exit
  process.on('SIGINT', async () => {
    console.log('Shutting down scraper...');
    await webScraper.close();
    process.exit(0);
  });

  console.log('Scheduler initialized - scraping every 15 minutes');
}
