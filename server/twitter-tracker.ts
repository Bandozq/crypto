import { broadcastToClients } from './websocket-handler';

interface TwitterMention {
  id: string;
  text: string;
  author: string;
  authorFollowers: number;
  createdAt: Date;
  publicMetrics: {
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  };
  sentiment: 'positive' | 'negative' | 'neutral';
  relevantTerms: string[];
  hashtags: string[];
}

interface TwitterTrend {
  term: string;
  volume: number;
  sentiment: number; // -1 to 1 scale
  mentions24h: number;
  influencerMentions: number;
  trending: boolean;
}

export class TwitterTracker {
  private bearerToken: string;
  private isTracking = false;
  private trackingTerms = [
    'P2E', 'PlayToEarn', 'GameFi', 'crypto gaming', 'blockchain gaming',
    'airdrop', 'crypto airdrop', 'token airdrop', 'free crypto',
    'DeFi', 'decentralized finance', 'yield farming', 'liquidity mining',
    'NFT', 'non-fungible token', 'NFT gaming', 'crypto collectibles',
    'altcoin', 'new listing', 'crypto launch', 'token launch'
  ];

  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN || '';
    if (!this.bearerToken) {
      console.warn('Twitter Bearer Token not provided - social sentiment tracking disabled');
    }
  }

  async startTracking() {
    if (!this.bearerToken) {
      throw new Error('Twitter Bearer Token is required for social sentiment tracking');
    }

    this.isTracking = true;
    console.log('Starting Twitter social sentiment tracking...');

    // Track mentions every 5 minutes
    setInterval(() => {
      this.trackMentions();
    }, 5 * 60 * 1000);

    // Track trends every 15 minutes
    setInterval(() => {
      this.updateTrends();
    }, 15 * 60 * 1000);

    // Initial tracking
    this.trackMentions();
    this.updateTrends();
  }

  private async trackMentions() {
    if (!this.isTracking) return;

    try {
      const mentions: TwitterMention[] = [];
      
      for (const term of this.trackingTerms) {
        const termMentions = await this.searchTweets(term);
        mentions.push(...termMentions);
      }

      // Sort by influence score (followers * engagement)
      mentions.sort((a, b) => {
        const scoreA = a.authorFollowers * (a.publicMetrics.retweetCount + a.publicMetrics.likeCount);
        const scoreB = b.authorFollowers * (b.publicMetrics.retweetCount + b.publicMetrics.likeCount);
        return scoreB - scoreA;
      });

      // Broadcast top mentions to connected clients
      broadcastToClients({
        type: 'twitter_mentions',
        data: mentions.slice(0, 20) // Top 20 most influential mentions
      });

    } catch (error) {
      console.error('Error tracking Twitter mentions:', error);
    }
  }

  private async searchTweets(query: string): Promise<TwitterMention[]> {
    try {
      const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=10&expansions=author_id&user.fields=public_metrics&tweet.fields=public_metrics,created_at`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) return [];

      const mentions: TwitterMention[] = data.data.map((tweet: any) => {
        const author = data.includes?.users?.find((user: any) => user.id === tweet.author_id);
        
        return {
          id: tweet.id,
          text: tweet.text,
          author: author?.username || 'unknown',
          authorFollowers: author?.public_metrics?.followers_count || 0,
          createdAt: new Date(tweet.created_at),
          publicMetrics: {
            retweetCount: tweet.public_metrics?.retweet_count || 0,
            likeCount: tweet.public_metrics?.like_count || 0,
            replyCount: tweet.public_metrics?.reply_count || 0,
            quoteCount: tweet.public_metrics?.quote_count || 0
          },
          sentiment: this.analyzeSentiment(tweet.text),
          relevantTerms: this.extractRelevantTerms(tweet.text),
          hashtags: this.extractHashtags(tweet.text)
        };
      });

      return mentions;
    } catch (error) {
      console.error(`Error searching tweets for "${query}":`, error);
      return [];
    }
  }

  private async updateTrends() {
    if (!this.isTracking) return;

    try {
      const trends: TwitterTrend[] = [];

      for (const term of this.trackingTerms) {
        const trend = await this.getTrendData(term);
        if (trend) {
          trends.push(trend);
        }
      }

      // Sort by trending score
      trends.sort((a, b) => b.volume - a.volume);

      // Broadcast trends to connected clients
      broadcastToClients({
        type: 'twitter_trends',
        data: trends
      });

    } catch (error) {
      console.error('Error updating Twitter trends:', error);
    }
  }

  private async getTrendData(term: string): Promise<TwitterTrend | null> {
    try {
      // Get recent mentions
      const mentions = await this.searchTweets(term);
      
      if (mentions.length === 0) return null;

      // Calculate sentiment average
      const sentimentSum = mentions.reduce((sum, mention) => {
        const sentimentValue = mention.sentiment === 'positive' ? 1 : 
                             mention.sentiment === 'negative' ? -1 : 0;
        return sum + sentimentValue;
      }, 0);
      
      const avgSentiment = sentimentSum / mentions.length;

      // Count influencer mentions (>10k followers)
      const influencerMentions = mentions.filter(m => m.authorFollowers > 10000).length;

      // Calculate volume based on engagement
      const volume = mentions.reduce((sum, mention) => {
        return sum + mention.publicMetrics.retweetCount + mention.publicMetrics.likeCount;
      }, 0);

      return {
        term,
        volume,
        sentiment: avgSentiment,
        mentions24h: mentions.length,
        influencerMentions,
        trending: volume > 100 && mentions.length > 5
      };

    } catch (error) {
      console.error(`Error getting trend data for "${term}":`, error);
      return null;
    }
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'amazing', 'love', 'best', 'awesome', 'bullish', 'moon', 'gem', 'opportunity'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'scam', 'dump', 'bearish', 'rug', 'avoid', 'warning'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractRelevantTerms(text: string): string[] {
    const terms: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const term of this.trackingTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        terms.push(term);
      }
    }
    
    return terms;
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  async getTrendingSentiment(): Promise<{ term: string; sentiment: number; volume: number }[]> {
    // This method can be called by API endpoints to get current trending sentiment
    const trends: { term: string; sentiment: number; volume: number }[] = [];
    
    for (const term of this.trackingTerms.slice(0, 10)) { // Top 10 terms
      const trendData = await this.getTrendData(term);
      if (trendData) {
        trends.push({
          term: trendData.term,
          sentiment: trendData.sentiment,
          volume: trendData.volume
        });
      }
    }
    
    return trends.sort((a, b) => b.volume - a.volume);
  }

  stopTracking() {
    this.isTracking = false;
    console.log('Twitter social sentiment tracking stopped');
  }
}

export const twitterTracker = new TwitterTracker();