import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Zap, 
  Clock,
  BarChart3,
  Gauge,
  Star,
  Award,
  X
} from "lucide-react";

interface TrendAnalysisDashboardProps {
  children: React.ReactNode;
}

export default function TrendAnalysisDashboard({ children }: TrendAnalysisDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: velocityData = [] } = useQuery({
    queryKey: ["/api/analytics/velocity"],
    refetchInterval: 60000,
  });

  const { data: hotnessData } = useQuery({
    queryKey: ["/api/analytics/hotness-progression"],
    refetchInterval: 60000,
  });

  const { data: sourceData = [] } = useQuery({
    queryKey: ["/api/analytics/source-correlation"],
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-crypto-card border border-gray-600 rounded-lg w-full max-w-4xl max-h-[75vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-400" />
                Advanced Trend Analysis
              </h2>
              <p className="text-slate-400">Real-time analysis of your 517 authentic opportunities</p>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(75vh-80px)]">
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

              {/* Opportunity Velocity Analysis */}
              <TabsContent value="velocity" className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-blue-400 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Category Velocity (Last 24 Hours)
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      How fast new opportunities appear in each category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {velocityData.map((category: any) => (
                        <div key={category.category} className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{category.category}</h4>
                            <Badge 
                              variant={category.trend === 'accelerating' ? 'default' : 
                                     category.trend === 'steady' ? 'secondary' : 'outline'}
                              className={category.trend === 'accelerating' ? 'bg-green-600' : ''}
                            >
                              {category.trend}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Velocity</span>
                              <span className="text-blue-400 font-semibold">
                                {category.velocityPerHour}/hour
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">New Opportunities</span>
                              <span className="text-green-400">{category.newOpportunities}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Avg Hotness</span>
                              <span className="text-orange-400">{category.averageHotness}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Leading Sources</span>
                              <span className="text-purple-400">{category.leadingSources.length}</span>
                            </div>
                            <Progress 
                              value={(category.velocityPerHour / 2) * 100} 
                              className="h-2 bg-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hotness Score Progression */}
              <TabsContent value="hotness" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-orange-400 flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Score Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hotnessData?.scoreDistribution && (
                        <div className="space-y-3">
                          {Object.entries(hotnessData.scoreDistribution).map(([range, count]: [string, any]) => (
                            <div key={range} className="flex items-center justify-between">
                              <span className="text-slate-300">{range}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      range.includes('Very Hot') ? 'bg-red-500' :
                                      range.includes('Hot') ? 'bg-orange-500' :
                                      range.includes('Warm') ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${(count / hotnessData.totalOpportunities) * 100}%` }}
                                  />
                                </div>
                                <span className="text-white font-semibold w-8">{count}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-orange-400 flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Category Leaders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hotnessData?.categoryHotness && (
                        <div className="space-y-3">
                          {hotnessData.categoryHotness.slice(0, 5).map((category: any, index: number) => (
                            <div key={category.category} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-black' :
                                  index === 1 ? 'bg-gray-400 text-black' :
                                  index === 2 ? 'bg-orange-600 text-white' : 'bg-slate-600 text-white'
                                }`}>
                                  {index + 1}
                                </div>
                                <span className="text-slate-300">{category.category}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-orange-400 font-semibold">{category.averageHotness}</div>
                                <div className="text-xs text-slate-500">{category.opportunityCount} ops</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {hotnessData && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-400">
                          {hotnessData.averageGlobalHotness}
                        </div>
                        <div className="text-slate-400">Global Average Hotness Score</div>
                        <div className="text-sm text-slate-500 mt-1">
                          Across {hotnessData.totalOpportunities} opportunities
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Source Correlation Analysis */}
              <TabsContent value="sources" className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Source Performance Rankings
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Which sources predict the hottest opportunities first
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sourceData.map((source: any, index: number) => (
                        <div key={source.source} className="bg-slate-900 p-4 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                source.performance === 'excellent' ? 'bg-green-600 text-white' :
                                source.performance === 'good' ? 'bg-blue-600 text-white' :
                                source.performance === 'fair' ? 'bg-yellow-600 text-black' : 'bg-red-600 text-white'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{source.source}</h4>
                                <Badge variant="outline" className={
                                  source.performance === 'excellent' ? 'border-green-400 text-green-400' :
                                  source.performance === 'good' ? 'border-blue-400 text-blue-400' :
                                  source.performance === 'fair' ? 'border-yellow-400 text-yellow-400' : 'border-red-400 text-red-400'
                                }>
                                  {source.performance}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-400">
                                {source.averageHotness}
                              </div>
                              <div className="text-xs text-slate-500">Avg Hotness</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-slate-400">Total Opportunities</div>
                              <div className="text-white font-semibold">{source.totalOpportunities}</div>
                            </div>
                            <div>
                              <div className="text-slate-400">Recent Discoveries</div>
                              <div className="text-blue-400 font-semibold">{source.recentDiscoveries}</div>
                            </div>
                            <div>
                              <div className="text-slate-400">Discovery Rate</div>
                              <div className="text-purple-400 font-semibold">{source.discoveryRate}/hour</div>
                            </div>
                            <div>
                              <div className="text-slate-400">Categories</div>
                              <div className="text-orange-400 font-semibold">{source.categories.length}</div>
                            </div>
                          </div>

                          {source.topOpportunities.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <div className="text-xs text-slate-400 mb-2">Top Discoveries:</div>
                              <div className="flex flex-wrap gap-1">
                                {source.topOpportunities.map((opp: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {opp.name} ({opp.hotness})
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}