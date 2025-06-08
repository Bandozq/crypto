import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Gift, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import OpportunityCard from "@/components/opportunity-card";

export default function AirdropsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(20);

  const { data: allOpportunities = [], isLoading } = useQuery({
    queryKey: ["/api/opportunities"],
    refetchInterval: 30000,
  });

  // Filter for active airdrops (excluding Ethereum and Bitcoin)
  const airdropOpportunities = useMemo(() => {
    if (!Array.isArray(allOpportunities)) return [];
    
    return allOpportunities.filter((opp: any) => {
      const name = opp.name?.toLowerCase() || '';
      const description = opp.description?.toLowerCase() || '';
      const category = opp.category?.toLowerCase() || '';
      
      // Exclude Bitcoin and Ethereum
      const isMainstream = name.includes('ethereum') || 
                          name.includes('bitcoin') || 
                          name.includes('btc') || 
                          name.includes('eth') ||
                          description.includes('ethereum') ||
                          description.includes('bitcoin');
      
      // Filter for airdrop-related opportunities
      const isAirdrop = category.includes('airdrop') ||
                       name.includes('airdrop') ||
                       description.includes('airdrop') ||
                       description.includes('free tokens') ||
                       description.includes('token distribution') ||
                       description.includes('claim');
      
      return !isMainstream && isAirdrop;
    }).filter((opp: any) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return opp.name?.toLowerCase().includes(query) ||
             opp.description?.toLowerCase().includes(query) ||
             opp.category?.toLowerCase().includes(query);
    }).sort((a: any, b: any) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }, [allOpportunities, searchQuery]);

  const displayedAirdrops = airdropOpportunities.slice(0, displayLimit);

  const getBorderColor = (hotnessScore: number) => {
    if (hotnessScore >= 80) return "border-red-500";
    if (hotnessScore >= 60) return "border-orange-500";
    if (hotnessScore >= 40) return "border-yellow-500";
    return "border-green-500";
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
            <h1 className="text-3xl font-bold">Active Airdrops</h1>
          </div>
          <div className="text-center py-12">Loading airdrops...</div>
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
                <Gift className="h-8 w-8 text-purple-400" />
                Active Airdrops
              </h1>
              <p className="text-slate-400">
                {airdropOpportunities.length} active token airdrops and free distributions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              <Gift className="h-4 w-4 mr-1" />
              {airdropOpportunities.length} Airdrops
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search airdrops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Airdrops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedAirdrops.map((airdrop: any) => (
            <OpportunityCard
              key={airdrop.id}
              opportunity={airdrop}
              borderColorClass={getBorderColor(airdrop.hotnessScore || 0)}
            />
          ))}
        </div>

        {/* Load More */}
        {displayedAirdrops.length < airdropOpportunities.length && (
          <div className="text-center">
            <Button 
              onClick={() => setDisplayLimit(prev => prev + 20)}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Load More Airdrops
            </Button>
          </div>
        )}

        {/* Empty State */}
        {airdropOpportunities.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 text-center py-12">
            <CardContent>
              <Gift className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No active airdrops found</h3>
              <p className="text-slate-400">
                {searchQuery ? "Try adjusting your search" : "Check back later for new airdrop opportunities"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-700/30 mt-8">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              About Airdrops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">
              Airdrops are free token distributions by crypto projects to build communities and reward early adopters. 
              These opportunities are sourced from AirdropAlert, CryptoNews, NFT Evening, and PlayToEarn websites.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}