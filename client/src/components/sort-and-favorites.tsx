import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowUpDown, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SortAndFavoritesProps {
  opportunities: any[];
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

export default function SortAndFavorites({ 
  opportunities, 
  onSortChange, 
  onExport 
}: SortAndFavoritesProps) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState('hotnessScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('crypto-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<number>) => {
    localStorage.setItem('crypto-favorites', JSON.stringify(Array.from(newFavorites)));
    setFavorites(newFavorites);
  };

  const toggleFavorite = (opportunityId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(opportunityId)) {
      newFavorites.delete(opportunityId);
      toast({
        title: "Removed from Favorites",
        description: "Opportunity removed from your favorites",
      });
    } else {
      newFavorites.add(opportunityId);
      toast({
        title: "Added to Favorites",
        description: "Opportunity saved to your favorites",
      });
    }
    saveFavorites(newFavorites);
  };

  const handleSortChange = (newSortBy: string) => {
    // If same field, toggle order; otherwise default to desc
    const newOrder = newSortBy === sortBy && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    onSortChange(newSortBy, newOrder);
  };

  const exportData = (format: 'csv' | 'pdf') => {
    const filteredData = opportunities.map(opp => ({
      name: opp.name,
      category: opp.category,
      hotnessScore: opp.hotnessScore,
      estimatedValue: opp.estimatedValue || 0,
      description: opp.description?.substring(0, 100) || '',
      isFavorite: favorites.has(opp.id)
    }));

    if (format === 'csv') {
      const csvContent = [
        'Name,Category,Hotness Score,Estimated Value,Description,Is Favorite',
        ...filteredData.map(row => 
          `"${row.name}","${row.category}",${row.hotnessScore},${row.estimatedValue},"${row.description}",${row.isFavorite}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-opportunities-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Export Complete",
        description: `Exported ${filteredData.length} opportunities to CSV`,
      });
    } else {
      // For PDF, we'll create a simple HTML version that can be printed
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Crypto Opportunities Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .favorite { color: #ff6b6b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Crypto Opportunities Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Total Opportunities: ${filteredData.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Hotness Score</th>
                <th>Estimated Value</th>
                <th>Description</th>
                <th>Favorite</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(row => `
                <tr>
                  <td>${row.name}</td>
                  <td>${row.category}</td>
                  <td>${row.hotnessScore}</td>
                  <td>$${row.estimatedValue}</td>
                  <td>${row.description}</td>
                  <td class="${row.isFavorite ? 'favorite' : ''}">${row.isFavorite ? '★' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      toast({
        title: "PDF Report Generated",
        description: "Report opened in new tab - use browser print to save as PDF",
      });
    }

    onExport(format);
  };

  const favoriteCount = favorites.size;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-48 bg-crypto-dark border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-crypto-dark border-gray-600">
            <SelectItem value="hotnessScore" className="text-white">Hotness Score</SelectItem>
            <SelectItem value="estimatedValue" className="text-white">Estimated Value</SelectItem>
            <SelectItem value="name" className="text-white">Name (A-Z)</SelectItem>
            <SelectItem value="category" className="text-white">Category</SelectItem>
            <SelectItem value="createdAt" className="text-white">Date Added</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSortChange(sortBy)}
          className="border-gray-600 hover:bg-gray-700"
        >
          {sortOrder === 'desc' ? '↓' : '↑'}
        </Button>
      </div>

      {/* Favorites Summary */}
      {favoriteCount > 0 && (
        <div className="flex items-center gap-1 text-sm text-gray-300">
          <Heart className="h-4 w-4 text-red-400 fill-current" />
          <span>{favoriteCount} favorite{favoriteCount !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Export Options */}
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-gray-400" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportData('csv')}
          className="border-gray-600 hover:bg-gray-700 gap-1"
        >
          <FileSpreadsheet className="h-3 w-3" />
          CSV
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportData('pdf')}
          className="border-gray-600 hover:bg-gray-700 gap-1"
        >
          <FileText className="h-3 w-3" />
          PDF
        </Button>
      </div>
    </div>
  );

  // Return the toggleFavorite function for use in opportunity cards
  return {
    SortAndFavoritesComponent: () => (
      <div className="flex flex-wrap items-center gap-3">
        {/* ... component JSX above ... */}
      </div>
    ),
    toggleFavorite,
    favorites
  };
}