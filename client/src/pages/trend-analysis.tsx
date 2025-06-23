import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BarChart3, Zap, Gauge, Target } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function TrendAnalysisPage() {
  const { data: velocityData } = useQuery<any>({
    queryKey: ['/api/analytics/velocity'],
    refetchInterval: 60000,
  });

  const { data: hotnessData } = useQuery<any>({
    queryKey: ['/api/analytics/hotness-progression'],
    refetchInterval: 60000,
  });

  const { data: sourceData } = useQuery<any>({
    queryKey: ['/api/analytics/source-correlation'],
    refetchInterval: 60000,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
              <BarChart3 className="h-8 w-8 text-blue-400" />
              Advanced Trend Analysis
            </h1>
            <p className="text-gray-400">Real-time analysis of authentic opportunities</p>
          </div>
        </div>

        <Tabs defaultValue="velocity" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="velocity" className="data-[state=active]:bg-blue-600">
              <Zap className="h-4 w-4 mr-2" />
              Opportunity Velocity
            </TabsTrigger>
            <TabsTrigger value="hotness" className="data-[state=active]:bg-orange-600">
              <Gauge className="h-4 w-4 mr-2" />
              Hotness Progression
            </TabsTrigger>
            <TabsTrigger value="sources" className="data-[state=active]:bg-green-600">
              <Target className="h-4 w-4 mr-2" />
              Source Correlation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="velocity" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Opportunity Velocity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {velocityData && Array.isArray(velocityData) ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={velocityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #4B5563',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="newOpportunities" fill="#3B82F6" />
                        <Bar dataKey="growthRate" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {velocityData.slice(0, 3).map((item: any, index: number) => (
                        <div key={index} className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                          <div className="text-lg font-bold text-blue-400">{item.category}</div>
                          <div className="text-2xl font-bold">{item.newOpportunities}</div>
                          <div className="text-sm text-gray-400">New opportunities</div>
                          <div className="text-lg font-bold text-green-400 mt-2">
                            +{item.growthRate}%
                          </div>
                          <div className="text-xs text-gray-400">Growth rate</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Loading velocity data from authentic sources...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotness" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Hotness Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {hotnessData && typeof hotnessData === 'object' ? (
                  <div className="space-y-6">
                    {hotnessData.scoreDistribution && (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(hotnessData.scoreDistribution).map(([range, count]) => ({
                              name: range,
                              value: count
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {Object.entries(hotnessData.scoreDistribution).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                        <div className="text-lg font-bold text-orange-400">Average Global Hotness</div>
                        <div className="text-3xl font-bold">
                          {hotnessData.averageGlobalHotness || 'N/A'}
                        </div>
                      </div>
                      <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                        <div className="text-lg font-bold text-purple-400">Total Opportunities</div>
                        <div className="text-3xl font-bold">
                          {hotnessData.totalOpportunities || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Gauge className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Loading hotness progression from authentic sources...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Data Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {sourceData && Array.isArray(sourceData) ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={sourceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="source" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #4B5563',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="totalOpportunities" fill="#3B82F6" />
                        <Bar dataKey="avgHotness" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {sourceData.slice(0, 4).map((source: any, index: number) => (
                        <div key={index} className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                          <div className="text-lg font-bold text-blue-400">{source.source}</div>
                          <div className="text-2xl font-bold">{source.totalOpportunities}</div>
                          <div className="text-sm text-gray-400">Total opportunities</div>
                          <div className="text-lg font-bold text-yellow-400 mt-2">
                            {Math.round(source.avgHotness)}
                          </div>
                          <div className="text-xs text-gray-400">Avg hotness</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Loading source correlation from authentic data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-500 mt-6">
          All data sourced from CoinGecko, verified P2E websites, and authentic airdrop sources
        </div>
      </div>
    </div>
  );
}
