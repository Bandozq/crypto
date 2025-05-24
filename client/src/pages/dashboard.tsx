import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import FilterBar from "@/components/filter-bar";
import OpportunityCard from "@/components/opportunity-card";
import NotificationsPanel from "@/components/notifications-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Flame, List, ChevronDown } from "lucide-react";
import type { Opportunity } from "@shared/schema";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("24h");
  const [displayLimit, setDisplayLimit] = useState(8);

  // Fetch hot opportunities
  const { data: hotOpportunities, isLoading: hotLoading } = useQuery({
    queryKey: ["/api/opportunities/hot", { limit: 4 }],
    refetchInterval: 60000, // Refresh every 60 seconds
  });

  // Fetch all opportunities with filters
  const { data: allOpportunities, isLoading: allLoading } = useQuery({
    queryKey: [
      "/api/opportunities",
      { 
        category: selectedCategory,
        timeFrame: selectedTimeFrame,
        search: searchQuery || undefined,
      }
    ],
    refetchInterval: 60000,
  });

  // Fetch dashboard stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 60000,
  });

  const displayedOpportunities = allOpportunities?.slice(0, displayLimit) || [];

  const loadMore = () => {
    setDisplayLimit(prev => prev + 8);
  };

  const getBorderColorClass = (score: number) => {
    if (score >= 250) return "border-crypto-red";
    if (score >= 200) return "border-crypto-orange";
    if (score >= 150) return "border-crypto-yellow";
    if (score >= 100) return "border-blue-500";
    return "border-gray-600";
  };

  return (
    <div className="min-h-screen bg-crypto-dark text-white">
      <Header stats={stats} />
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={setSelectedTimeFrame}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hot Opportunities Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Flame className="text-crypto-red mr-3" />
              Hottest Opportunities
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-crypto-green rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
          </div>

          {hotLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-crypto-card rounded-xl border border-gray-600 overflow-hidden">
                  <Skeleton className="w-full h-32 bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                    <Skeleton className="h-3 w-full bg-gray-700" />
                    <Skeleton className="h-3 w-2/3 bg-gray-700" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-gray-700" />
                      <Skeleton className="h-3 w-full bg-gray-700" />
                    </div>
                    <Skeleton className="h-8 w-full bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {hotOpportunities?.map((opportunity: Opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isHot={true}
                  borderColorClass={getBorderColorClass(opportunity.hotnessScore || 0)}
                />
              ))}
            </div>
          )}
        </div>

        {/* All Opportunities Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <List className="text-crypto-blue mr-3" />
              All Opportunities
            </h2>
            <div className="text-sm text-gray-400">
              {allOpportunities?.length || 0} opportunities found
            </div>
          </div>

          {allLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-crypto-card rounded-xl border border-gray-600 overflow-hidden">
                  <Skeleton className="w-full h-32 bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                    <Skeleton className="h-3 w-full bg-gray-700" />
                    <Skeleton className="h-3 w-2/3 bg-gray-700" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full bg-gray-700" />
                      <Skeleton className="h-3 w-full bg-gray-700" />
                    </div>
                    <Skeleton className="h-8 w-full bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedOpportunities.map((opportunity: Opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    isHot={false}
                    borderColorClass={getBorderColorClass(opportunity.hotnessScore || 0)}
                  />
                ))}
              </div>

              {allOpportunities && displayLimit < allOpportunities.length && (
                <div className="text-center mt-8">
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    className="bg-crypto-card hover:bg-gray-600 border-gray-600 text-white px-8 py-3"
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More Opportunities
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Floating Notification Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <NotificationsPanel>
          <Button className="bg-crypto-blue hover:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 relative">
            <span className="sr-only">Notifications</span>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <div className="absolute -top-2 -right-2 bg-crypto-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              3
            </div>
          </Button>
        </NotificationsPanel>
      </div>
    </div>
  );
}
