import { twitterTracker } from './twitter-tracker';

console.log('Starting the Twitter tracking service...');
try {
  twitterTracker.startTracking();
  console.log('Twitter social sentiment tracking initialized');
} catch (error) {
  console.log('Twitter tracking disabled:', error instanceof Error ? error.message : 'Unknown error');
}
