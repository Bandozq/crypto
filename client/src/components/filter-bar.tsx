import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedTimeFrame: string;
  onTimeFrameChange: (timeFrame: string) => void;
}

const categories = [
  { value: "all", label: "All" },
  { value: "P2E Games", label: "P2E Games" },
  { value: "Airdrops", label: "Airdrops" },
  { value: "New Listings", label: "New Listings" },
  { value: "DeFi", label: "DeFi" },
  { value: "NFT", label: "NFTs" },
];

const timeFrames = [
  { value: "1h", label: "Last Hour" },
  { value: "6h", label: "Last 6 Hours" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last Week" },
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTimeFrame,
  onTimeFrameChange,
}: FilterBarProps) {
  return (
    <div className="bg-crypto-card border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search projects, tokens, or categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-crypto-dark border-gray-600 pl-10 text-white placeholder-gray-400 focus:border-crypto-blue"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                variant={selectedCategory === category.value ? "default" : "outline"}
                className={
                  selectedCategory === category.value
                    ? "bg-crypto-blue text-white"
                    : "bg-gray-600 hover:bg-gray-500 text-white border-gray-500"
                }
                size="sm"
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Time Filter */}
          <Select value={selectedTimeFrame} onValueChange={onTimeFrameChange}>
            <SelectTrigger className="w-[180px] bg-crypto-dark border-gray-600 text-white focus:border-crypto-blue">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-crypto-dark border-gray-600">
              {timeFrames.map((timeFrame) => (
                <SelectItem 
                  key={timeFrame.value} 
                  value={timeFrame.value}
                  className="text-white hover:bg-gray-600 focus:bg-gray-600"
                >
                  {timeFrame.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
