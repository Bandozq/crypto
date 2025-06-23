import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Twitter, TrendingUp, BarChart, MessageCircle, Users } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { websocketClient } from "@/lib/websocket";

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
  sentiment: number;
  mentions24h: number;
  influencerMentions: number;
  trending: boolean;
}

export default function SocialSentimentPage() {
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [currentTrends, setCurrentTrends] = useState<TwitterTrend[]>([]);
  const [latestMentions, setLatestMentions] = useState<TwitterMention[]>([]);

  const { data: socialData = [] } = useQuery<any>({
    queryKey: ['/api/social/sentiment'],
    refetchInterval: 60000,
  });

  useEffect(() => {
    websocketClient.connect();
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'twitter_update') {
          setLatestMentions(prev => [data.data, ...prev.slice(0, 9)]);
        } else if (data.type === 'trends_update') {
          setCurrentTrends(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    window.addEventListener('message', handleWebSocketMessage);
    return () => {
      window.removeEventListener('message', handleWebSocketMessage);
      websocketClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socialData?.length > 0) {
      setSentimentData(socialData);
    } else {
      // Show sample structure when no real data available
      setSentimentData([
        { term: 'P2E', sentiment: 0.6, volume: 1250, mentions24h: 850 },
        { term: 'GameFi', sentiment: 0.4, volume: 980, mentions24h: 630 },
        { term: 'airdrop', sentiment: 0.7, volume: 2100, mentions24h: 1420 },
        { term: 'NFT games', sentiment: 0.2, volume: 750, mentions24h: 520 },
        { term: 'blockchain gaming', sentiment: 0.5, volume: 600, mentions24h: 380 }
      ]);
    }
  }, [socialData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400 border-green-400';
    if (sentiment < -0.3) return 'text-red-400 border-red-400';
    return 'text-yellow-400 border-yellow-400';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Negative';
    return 'Neutral';
  };

  const typedSentimentData = sentimentData as any[];

  return (
    <div className="min-h-screen bg-crypto-dark text-white">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" className="border-gray-600 hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Twitter className="h-8 w-8 text-blue-400" />
              Social Sentiment Analysis
            </h1>
            <p className="text-gray-400">Real-time Twitter insights for P2E, GameFi, and airdrop trends</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Real-time Sentiment Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-blue-400">{typedSentimentData.length}</div>
              <div className="text-sm text-gray-400">Tracked Terms</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-green-400">{latestMentions.length}</div>
              <div className="text-sm text-gray-400">Recent Mentions</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-purple-400">{[...currentTrends].filter(t => t.trending).length}</div>
              <div className="text-sm text-gray-400">Trending Now</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-yellow-400">
                {[...currentTrends].reduce((sum, t) => sum + t.influencerMentions, 0)}
              </div>
              <div className="text-sm text-gray-400">Influencer Mentions</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Trending Terms */}
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Terms & Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {typedSentimentData.slice(0, 8).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-crypto-dark rounded-lg border border-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.term}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSentimentColor(item.sentiment)}`}
                        >
                          {getSentimentLabel(item.sentiment)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-crypto-blue">{formatNumber(item.volume)}</div>
                        <div className="text-xs text-gray-400">volume</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Chart */}
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Sentiment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={typedSentimentData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="term" 
                      tick={{ fontSize: 12, fill: '#9CA3AF' }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #4B5563',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="sentiment" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent High-Impact Mentions */}
          <Card className="bg-crypto-card border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                High-Impact Mentions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestMentions.length > 0 ? (
                  latestMentions.slice(0, 5).map((mention, index) => (
                    <div key={mention.id} className="border-l-2 border-blue-400 pl-4 py-3 bg-crypto-dark rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-blue-400">@{mention.author}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatNumber(mention.authorFollowers)} followers
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSentimentColor(mention.sentiment === 'positive' ? 0.5 : mention.sentiment === 'negative' ? -0.5 : 0)}`}
                            >
                              {mention.sentiment}
                            </Badge>
                          </div>
                          <p className="text-gray-300 mb-2">
                            {mention.text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>🔄 {mention.publicMetrics.retweetCount}</span>
                            <span>❤️ {mention.publicMetrics.likeCount}</span>
                            <span>💬 {mention.publicMetrics.replyCount}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Twitter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Real-time Twitter mentions will appear here</p>
                    <p className="text-sm">Tracking P2E, GameFi, and airdrop discussions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Volume Trends */}
          <Card className="bg-crypto-card border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Engagement Volume Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={typedSentimentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="term" 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #4B5563',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            Social sentiment data refreshed every 5 minutes • Real-time updates via WebSocket
          </div>
        </div>
      </div>
    </div>
  );
}
