import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Link } from "wouter";
import OpportunityCard from "@/components/opportunity-card";

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(20);

  const { data: allOpportunities = [], isLoading } = useQuery({
    queryKey: ["/api/opportunities"],
    refetchInterval: 30000,
  });

  // Filter out Ethereum and Bitcoin, apply search and category filters
  const filteredOpportunities = useMemo(() => {
    if (!Array.isArray(allOpportunities)) return [];
    
    let filtered = allOpportunities.filter((opp: any) => {
      const name = opp.name?.toLowerCase() || '';
      const description = opp.description?.toLowerCase() || '';
      return !name.includes('ethereum') && 
             !name.includes('bitcoin') && 
             !name.includes('btc') && 
             !name.includes('eth') &&
             !description.includes('ethereum') &&
             !description.includes('bitcoin');
    });

    if (selectedCategory !== "all") {
      filtered = filtered.filter((opp: any) => 
        opp.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((opp: any) =>
        opp.name?.toLowerCase().includes(query) ||
        opp.description?.toLowerCase().includes(query) ||
        opp.category?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a: any, b: any) => (b.hotnessScore || 0) - (a.hotnessScore || 0));
  }, [allOpportunities, selectedCategory, searchQuery]);

  const displayedOpportunities = filteredOpportunities.slice(0, displayLimit);

  const categories = Array.from(new Set(
    allOpportunities
      .filter((opp: any) => {
        const name = opp.name?.toLowerCase() || '';
        return !name.includes('ethereum') && !name.includes('bitcoin') && !name.includes('btc') && !name.includes('eth');
      })
      .map((opp: any) => opp.category)
      .filter(Boolean)
  ));

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
            <h1 className="text-3xl font-bold">All Opportunities</h1>
          </div>
          <div className="text-center py-12">Loading opportunities...</div>
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
              <h1 className="text-3xl font-bold">All Opportunities</h1>
              <p className="text-slate-400">
                {filteredOpportunities.length} crypto opportunities (excluding Bitcoin & Ethereum)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400">
              <TrendingUp className="h-4 w-4 mr-1" />
              {filteredOpportunities.length} Total
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Showing:</span>
            <Badge variant="secondary">{displayedOpportunities.length} of {filteredOpportunities.length}</Badge>
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedOpportunities.map((opportunity: any) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              borderColorClass={getBorderColor(opportunity.hotnessScore || 0)}
            />
          ))}
        </div>

        {/* Load More */}
        {displayedOpportunities.length < filteredOpportunities.length && (
          <div className="text-center">
            <Button 
              onClick={() => setDisplayLimit(prev => prev + 20)}
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Load More Opportunities
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredOpportunities.length === 0 && (
          <Card className="bg-slate-900 border-slate-700 text-center py-12">
            <CardContent>
              <TrendingUp className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No opportunities found</h3>
              <p className="text-slate-400">Try adjusting your search or category filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}