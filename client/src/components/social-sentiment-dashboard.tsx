import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Twitter, TrendingUp, Users, MessageCircle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SocialSentimentDashboardProps {
  children: React.ReactNode;
}

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

export default function SocialSentimentDashboard({ children }: SocialSentimentDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestMentions, setLatestMentions] = useState<TwitterMention[]>([]);
  const [currentTrends, setCurrentTrends] = useState<TwitterTrend[]>([]);

  const { data: sentimentData = [] } = useQuery({
    queryKey: ["/api/social/sentiment"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Type-safe access to sentiment data
  const typedSentimentData = Array.isArray(sentimentData) ? sentimentData : [];

  useEffect(() => {
    // Listen for real-time Twitter updates via WebSocket
    const handleWebSocketMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'twitter_mentions') {
        setLatestMentions(message.data);
      } else if (message.type === 'twitter_trends') {
        setCurrentTrends(message.data);
      }
    };

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.addEventListener('message', handleWebSocketMessage);
      
      return () => {
        socket.removeEventListener('message', handleWebSocketMessage);
        socket.close();
      };
    }
  }, []);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-400';
    if (sentiment < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Bullish';
    if (sentiment < -0.3) return 'Bearish';
    return 'Neutral';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[85vh] bg-crypto-card border-gray-600 text-white shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-600">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-blue-400" />
                  Social Sentiment Tracking
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 space-y-6 overflow-y-auto max-h-[calc(85vh-100px)]">
              {/* Real-time Sentiment Overview */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-crypto-dark rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{typedSentimentData.length}</div>
                  <div className="text-xs text-gray-400">Tracked Terms</div>
                </div>
                <div className="text-center p-3 bg-crypto-dark rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{latestMentions.length}</div>
                  <div className="text-xs text-gray-400">Recent Mentions</div>
                </div>
                <div className="text-center p-3 bg-crypto-dark rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{currentTrends.filter(t => t.trending).length}</div>
                  <div className="text-xs text-gray-400">Trending Now</div>
                </div>
                <div className="text-center p-3 bg-crypto-dark rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {currentTrends.reduce((sum, t) => sum + t.influencerMentions, 0)}
                  </div>
                  <div className="text-xs text-gray-400">Influencer Mentions</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Trending Terms */}
                <Card className="bg-crypto-dark border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Trending Terms & Sentiment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {typedSentimentData.slice(0, 8).map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.term}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSentimentColor(item.sentiment)}`}
                            >
                              {getSentimentLabel(item.sentiment)}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-crypto-blue">{formatNumber(item.volume)}</div>
                            <div className="text-xs text-gray-400">volume</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Chart */}
                <Card className="bg-crypto-dark border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Sentiment Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={sentimentData.slice(0, 6)}>
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
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent High-Impact Mentions */}
              <Card className="bg-crypto-dark border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    High-Impact Mentions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {latestMentions.slice(0, 5).map((mention, index) => (
                      <div key={mention.id} className="border-l-2 border-blue-400 pl-3 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-blue-400">@{mention.author}</span>
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
                            <p className="text-sm text-gray-300 mb-2 line-clamp-2">
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
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Volume Trends */}
              <Card className="bg-crypto-dark border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Engagement Volume Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sentimentData}>
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

              <div className="text-xs text-gray-500 text-center">
                Social sentiment data refreshed every 5 minutes • Real-time updates via WebSocket
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}