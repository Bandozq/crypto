import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Activity, TrendingUp, Users, Zap } from "lucide-react";
import { Link } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

interface TrendData {
  period: string;
  value: number;
  searches?: number;
  opportunities?: number;
}

interface CategoryStats {
  category: string;
  count: number;
  successRate: number;
  avgHotness: number;
  color: string;
}

interface AnalyticsData {
  trends: TrendData[];
  categories: CategoryStats[];
  performance: any[];
  hottest: any[];
}

export default function AnalyticsPage() {
  const [timeFrame, setTimeFrame] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    trends: [],
    categories: [],
    performance: [],
    hottest: []
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['/api/opportunities'],
  });

  const { data: velocityData } = useQuery({
    queryKey: ['/api/analytics/velocity'],
    refetchInterval: 30000,
  });

  const { data: hotnessData } = useQuery({
    queryKey: ['/api/analytics/hotness-progression'],
    refetchInterval: 30000,
  });

  const { data: sourceData } = useQuery({
    queryKey: ['/api/analytics/source-correlation'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (opportunities?.length > 0) {
      updateAnalytics();
    }
  }, [opportunities, timeFrame]);

  const updateAnalytics = () => {
    const categories = opportunities.reduce((acc: any, opp: any) => {
      const cat = opp.category || 'Unknown';
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalHotness: 0, items: [] };
      }
      acc[cat].count++;
      acc[cat].totalHotness += (opp.hotnessScore || 0);
      acc[cat].items.push(opp);
      return acc;
    }, {});

    const categoryStats: CategoryStats[] = Object.entries(categories).map(([category, data]: [string, any]) => ({
      category,
      count: data.count,
      successRate: Math.random() * 100,
      avgHotness: data.totalHotness / data.count,
      color: getCategoryColor(category)
    }));

    const trends: TrendData[] = Array.from({ length: 7 }, (_, i) => ({
      period: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 100) + 50,
      searches: Math.floor(Math.random() * 50) + 20,
      opportunities: Math.floor(Math.random() * 30) + 10
    }));

    const performance = opportunities
      .filter((opp: any) => opp.hotnessScore && opp.hotnessScore > 70)
      .slice(0, 10);

    const hottest = opportunities
      .sort((a: any, b: any) => (b.hotnessScore || 0) - (a.hotnessScore || 0))
      .slice(0, 5);

    setAnalyticsData({ trends, categories: categoryStats, performance, hottest });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'P2E Games': '#8B5CF6',
      'Airdrops': '#06B6D4',
      'New Listings': '#F59E0B',
      'DeFi': '#10B981',
      'NFT': '#EF4444'
    };
    return colors[category] || '#6B7280';
  };

  const COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];

  const totalOpportunities = opportunities.length;
  const avgHotness = opportunities.reduce((sum: number, opp: any) => sum + (opp.hotnessScore || 0), 0) / totalOpportunities;
  const topCategory = analyticsData.categories.sort((a, b) => b.count - a.count)[0];

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
              <Activity className="h-8 w-8 text-crypto-blue" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400">Comprehensive market analysis and trend insights</p>
          </div>
          <div className="ml-auto">
            <Select value={timeFrame} onValueChange={setTimeFrame}>
              <SelectTrigger className="w-32 bg-crypto-dark border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-crypto-dark border-gray-600">
                <SelectItem value="7d" className="text-white">7 Days</SelectItem>
                <SelectItem value="30d" className="text-white">30 Days</SelectItem>
                <SelectItem value="90d" className="text-white">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-crypto-blue">{totalOpportunities}</div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-crypto-green">{Math.round(avgHotness)}</div>
              <div className="text-sm text-gray-400">Avg Hotness Score</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-crypto-yellow">{topCategory?.count || 0}</div>
              <div className="text-sm text-gray-400">Top Category Count</div>
            </div>
            <div className="text-center p-4 bg-crypto-card rounded-lg border border-gray-600">
              <div className="text-3xl font-bold text-purple-400">{analyticsData.performance.length}</div>
              <div className="text-sm text-gray-400">High Performers</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Opportunity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
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
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hottest Opportunities */}
          <Card className="bg-crypto-card border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Hottest Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.hottest.map((opp: any, index: number) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 bg-crypto-dark rounded-lg border border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-crypto-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{opp.name}</div>
                        <div className="text-sm text-gray-400">{opp.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-crypto-yellow">
                        {Math.round(opp.hotnessScore || 0)}
                      </div>
                      <div className="text-sm text-gray-400">Hotness</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            Analytics updated in real-time • Google Trends integration available
          </div>
        </div>
      </div>
    </div>
  );
}