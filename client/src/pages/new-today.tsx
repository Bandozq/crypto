import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Sparkles, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import OpportunityCard from "@/components/opportunity-card";

export default function NewTodayPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(20);

  const { data: allOpportunities = [], isLoading } = useQuery({
    queryKey: ["/api/opportunities"],
    refetchInterval: 30000,
  });

  // Filter for new opportunities from today (excluding Ethereum and Bitcoin)
  const newTodayOpportunities = useMemo(() => {
    if (!Array.isArray(allOpportunities)) return [];
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return allOpportunities.filter((opp: any) => {
      const name = opp.name?.toLowerCase() || '';
      const description = opp.description?.toLowerCase() || '';
      
      // Exclude Bitcoin and Ethereum
      const isMainstream = name.includes('ethereum') || 
                          name.includes('bitcoin') || 
                          name.includes('btc') || 
                          name.includes('eth') ||
                          description.includes('ethereum') ||
                          description.includes('bitcoin');
      
      // Check if opportunity was created today
      const createdDate = opp.createdAt ? new Date(opp.createdAt) : null;
      const isNewToday = createdDate && createdDate >= todayStart;
      
      return !isMainstream && isNewToday;
    }).filter((opp: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return opp.name?.toLowerCase().includes(query) ||
             opp.description?.toLowerCase().includes(query) ||
             opp.category?.toLowerCase().includes(query);
    }).sort((a: any, b: any) => {
      // Sort by creation time (newest first), then by hotness score
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.hotnessScore || 0) - (a.hotnessScore || 0);
    });
  }, [allOpportunities, searchQuery]);

  const displayedOpportunities = newTodayOpportunities.slice(0, displayLimit);

  const getBorderColor = (hotnessScore: number) => {
    if (hotnessScore >= 80) return "border-red-500";
    if (hotnessScore >= 60) return "border-orange-500";
    if (hotnessScore >= 40) return "border-yellow-500";
    return "border-green-500";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">New Today</h1>
          </div>
          <div className="text-center py-12">Loading new opportunities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-blue-400" />
                New Today
              </h1>
              <p className="text-slate-400">
                {newTodayOpportunities.length} fresh opportunities discovered today
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Sparkles className="h-4 w-4 mr-1" />
              {newTodayOpportunities.length} New
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search new opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* New Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedOpportunities.map((opportunity: any) => (
            <div key={opportunity.id} className="relative">
              <OpportunityCard
                opportunity={opportunity}
                borderColorClass={getBorderColor(opportunity.hotnessScore || 0)}
              />
              {/* New Badge */}
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-blue-500 text-white border-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(opportunity.createdAt)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {displayedOpportunities.length < newTodayOpportunities.length && (
          <div className="text-center">
            <Button 
              onClick={() => setDisplayLimit(prev => prev + 20)}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Load More New Opportunities
            </Button>
          </div>
        )}

        {/* Empty State */}
        {newTodayOpportunities.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 text-center py-12">
            <CardContent>
              <Sparkles className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No new opportunities today</h3>
              <p className="text-slate-400">
                {searchQuery ? "Try adjusting your search" : "Check back later as our system continuously discovers new opportunities"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-700/30 mt-8">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Fresh Discoveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              These opportunities were discovered today from our real-time monitoring of CoinGecko, CoinMarketCap, 
              AirdropAlert, CryptoNews, NFT Evening, and PlayToEarn. Stay ahead of the curve with the latest crypto opportunities!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}