import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calendar, SlidersHorizontal, X } from "lucide-react";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
}

export default function AdvancedFilters({ onFiltersChange, currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    marketCapRange: [0, 1000000000],
    hotnessScore: [0, 500],
    dateRange: 'all',
    hasLinks: false,
    ...currentFilters
  });

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      priceRange: [0, 10000],
      marketCapRange: [0, 1000000000],
      hotnessScore: [0, 500],
      dateRange: 'all',
      hasLinks: false
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="border-gray-600 hover:bg-gray-700 gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Advanced Filters
      </Button>

      {isOpen && (
        <Card className="absolute left-0 top-full mt-2 w-96 bg-crypto-card border-gray-600 text-white z-50 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-600">
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-4 space-y-6">
            {/* Price Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Price Range: {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value)}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>

            {/* Market Cap Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Market Cap: {formatCurrency(filters.marketCapRange[0])} - {formatCurrency(filters.marketCapRange[1])}
              </Label>
              <Slider
                value={filters.marketCapRange}
                onValueChange={(value) => updateFilter('marketCapRange', value)}
                max={1000000000}
                min={0}
                step={10000000}
                className="w-full"
              />
            </div>

            {/* Hotness Score */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Hotness Score: {filters.hotnessScore[0]} - {filters.hotnessScore[1]}
              </Label>
              <Slider
                value={filters.hotnessScore}
                onValueChange={(value) => updateFilter('hotnessScore', value)}
                max={500}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Time Period</Label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => updateFilter('dateRange', value)}
              >
                <SelectTrigger className="bg-crypto-dark border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-crypto-dark border-gray-600">
                  <SelectItem value="all" className="text-white">All Time</SelectItem>
                  <SelectItem value="1h" className="text-white">Last Hour</SelectItem>
                  <SelectItem value="6h" className="text-white">Last 6 Hours</SelectItem>
                  <SelectItem value="24h" className="text-white">Last 24 Hours</SelectItem>
                  <SelectItem value="7d" className="text-white">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <Button 
              onClick={resetFilters}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-700"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}