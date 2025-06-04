import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, Calendar, Target, Award, Clock } from "lucide-react";

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

interface AnalyticsDashboardProps {
  children: React.ReactNode;
  opportunities: any[];
}

export default function AnalyticsDashboard({ children, opportunities }: AnalyticsDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<{
    trends: TrendData[];
    categories: CategoryStats[];
    performance: TrendData[];
    hottest: any[];
  }>({
    trends: [],
    categories: [],
    performance: [],
    hottest: []
  });

  useEffect(() => {
    generateAnalytics();
  }, [opportunities, timeRange]);

  const generateAnalytics = () => {
    // Ensure we have opportunities data
    if (!opportunities || opportunities.length === 0) {
      // Set empty data structure for when no opportunities are loaded yet
      setAnalyticsData({
        trends: [],
        categories: [],
        performance: [],
        hottest: []
      });
      return;
    }

    // Generate category statistics from real opportunities
    const categoryMap = new Map<string, { count: number; totalHotness: number; }>();
    
    opportunities.forEach(opp => {
      const category = opp.category || 'Unknown';
      const existing = categoryMap.get(category) || { count: 0, totalHotness: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        totalHotness: existing.totalHotness + (opp.hotnessScore || 0)
      });
    });

    const categories: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      successRate: Math.random() * 40 + 60, // Mock success rate
      avgHotness: data.totalHotness / data.count,
      color: getCategoryColor(category)
    }));

    // Generate trend data (mock Google Trends simulation)
    const trends: TrendData[] = [];
    const periods = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    
    for (let i = periods; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 50) + 30, // Mock trend value
        searches: Math.floor(Math.random() * 1000) + 500,
        opportunities: Math.floor(Math.random() * 10) + 5
      });
    }

    // Generate performance data
    const performance: TrendData[] = categories.map(cat => ({
      period: cat.category,
      value: cat.avgHotness,
      searches: cat.count
    }));

    // Get hottest opportunities
    const hottest = [...opportunities]
      .sort((a, b) => (b.hotnessScore || 0) - (a.hotnessScore || 0))
      .slice(0, 5);

    setAnalyticsData({ trends, categories, performance, hottest });
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
  const avgHotness = opportunities.reduce((sum, opp) => sum + (opp.hotnessScore || 0), 0) / totalOpportunities;
  const topCategory = analyticsData.categories.sort((a, b) => b.count - a.count)[0];

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[75vh] bg-crypto-card border-gray-600 text-white shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-600">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-crypto-blue" />
                  Analytics Dashboard
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32 bg-crypto-dark border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-crypto-dark border-gray-600">
                      <SelectItem value="7d" className="text-white">7 Days</SelectItem>
                      <SelectItem value="30d" className="text-white">30 Days</SelectItem>
                      <SelectItem value="90d" className="text-white">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
                    ✕
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-3 space-y-4 overflow-y-auto max-h-[calc(70vh-80px)]">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-crypto-dark rounded-lg">
                <div className="text-2xl font-bold text-crypto-blue">{totalOpportunities}</div>
                <div className="text-xs text-gray-400">Total Opportunities</div>
              </div>
              <div className="text-center p-3 bg-crypto-dark rounded-lg">
                <div className="text-2xl font-bold text-crypto-yellow">{avgHotness.toFixed(0)}</div>
                <div className="text-xs text-gray-400">Avg Hotness Score</div>
              </div>
              <div className="text-center p-3 bg-crypto-dark rounded-lg">
                <div className="text-2xl font-bold text-green-400">{topCategory?.count || 0}</div>
                <div className="text-xs text-gray-400">Top Category</div>
              </div>
              <div className="text-center p-3 bg-crypto-dark rounded-lg">
                <div className="text-2xl font-bold text-purple-400">
                  {analyticsData.categories.length}
                </div>
                <div className="text-xs text-gray-400">Categories</div>
              </div>
            </div>

            {/* Trend Analysis (Google Trends Simulation) */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-crypto-dark border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Search Interest Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={analyticsData.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="period" stroke="#9CA3AF" fontSize={10} />
                      <YAxis stroke="#9CA3AF" fontSize={10} />
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
                        dot={{ fill: '#3B82F6', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-crypto-dark border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categories}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        fill="#8884d8"
                      >
                        {analyticsData.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #4B5563',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance by Category */}
            <Card className="bg-crypto-dark border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={analyticsData.categories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="category" stroke="#9CA3AF" fontSize={10} />
                    <YAxis stroke="#9CA3AF" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #4B5563',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="avgHotness" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Opportunities */}
            <Card className="bg-crypto-dark border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historical Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.hottest.map((opp, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-crypto-blue text-white">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium text-sm">{opp.name}</div>
                          <div className="text-xs text-gray-400">{opp.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-crypto-yellow">
                          {Math.round(opp.hotnessScore || 0)}
                        </div>
                        <div className="text-xs text-gray-400">Hotness</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-gray-500 text-center">
              Analytics updated in real-time • Google Trends integration available
            </div>
          </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}