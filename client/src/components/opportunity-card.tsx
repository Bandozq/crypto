import { ExternalLink, Bookmark, Star, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Opportunity } from "@shared/schema";

interface OpportunityCardProps {
  opportunity: Opportunity;
  isHot?: boolean;
  borderColorClass: string;
}

export default function OpportunityCard({ 
  opportunity, 
  isHot = false, 
  borderColorClass 
}: OpportunityCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'p2e games':
        return 'bg-purple-600';
      case 'airdrops':
        return 'bg-green-600';
      case 'defi':
        return 'bg-green-600';
      case 'nft':
        return 'bg-pink-600';
      case 'new listings':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'p2e games':
        return '🎮';
      case 'airdrops':
        return '🪂';
      case 'defi':
        return '🏦';
      case 'nft':
        return '🖼️';
      case 'new listings':
        return '🚀';
      default:
        return '💎';
    }
  };

  const getHotnessIcon = (score: number) => {
    if (score >= 250) return <Flame className="mr-1 animate-pulse h-3 w-3" />;
    if (score >= 200) return <Zap className="mr-1 h-3 w-3" />;
    if (score >= 150) return <Star className="mr-1 h-3 w-3" />;
    return null;
  };

  const getHotnessColor = (score: number) => {
    if (score >= 250) return 'bg-crypto-red';
    if (score >= 200) return 'bg-crypto-orange';
    if (score >= 150) return 'bg-crypto-yellow text-black';
    if (score >= 100) return 'bg-blue-500';
    return 'bg-gray-600';
  };

  const formatValue = (value: number | null | undefined) => {
    if (!value) return 'N/A';
    return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`bg-crypto-card rounded-xl border ${borderColorClass} shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden`}>
      <div className="relative">
        {/* Hotness Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className={`px-3 py-1 rounded-full text-xs font-bold text-white flex items-center ${getHotnessColor(opportunity.hotnessScore || 0)}`}>
            {getHotnessIcon(opportunity.hotnessScore || 0)}
            <span>{Math.round(opportunity.hotnessScore || 0)}</span>
          </div>
        </div>

        {/* Image with crypto-themed design */}
        <div className="w-full h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative overflow-hidden">
          {opportunity.imageUrl ? (
            <img 
              src={opportunity.imageUrl} 
              alt={opportunity.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="text-gray-400 text-center">
              <div className="text-3xl mb-1">{getCategoryIcon(opportunity.category)}</div>
              <div className="text-xs font-medium">{opportunity.category}</div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-crypto-card via-transparent to-transparent"></div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-white group-hover:text-crypto-blue transition-colors text-sm line-clamp-1">
            {opportunity.name}
          </h3>
          <Badge className={`text-xs ${getCategoryColor(opportunity.category)} text-white ml-2 flex-shrink-0`}>
            {opportunity.category}
          </Badge>
        </div>

        <p className="text-gray-300 text-xs mb-3 line-clamp-2">
          {opportunity.description}
        </p>

        <div className="space-y-2 mb-4 text-xs">
          {opportunity.estimatedValue && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Est. Value:</span>
              <span className="text-crypto-green font-semibold">
                {formatValue(opportunity.estimatedValue)}
              </span>
            </div>
          )}
          
          {opportunity.timeRemaining && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Time Left:</span>
              <span className="text-crypto-yellow font-semibold">
                {opportunity.timeRemaining}
              </span>
            </div>
          )}

          {opportunity.participants && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Participants:</span>
              <span className="text-white">{formatNumber(opportunity.participants)}</span>
            </div>
          )}

          {opportunity.twitterFollowers && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Followers:</span>
              <span className="text-white">{formatNumber(opportunity.twitterFollowers)}</span>
            </div>
          )}

          {opportunity.tradingVolume && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Volume:</span>
              <span className="text-crypto-green font-semibold">
                {formatValue(opportunity.tradingVolume)}
              </span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            size="sm"
            className="flex-1 bg-crypto-blue hover:bg-blue-600 text-white text-xs"
            onClick={() => {
              if (opportunity.websiteUrl) {
                window.open(opportunity.websiteUrl, '_blank');
              }
            }}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Visit
          </Button>
          <Button 
            size="sm"
            variant="outline"
            className="bg-gray-600 hover:bg-gray-500 text-white border-gray-500 text-xs"
          >
            <Bookmark className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
