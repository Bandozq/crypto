import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface DataSource {
  active: boolean;
  lastUpdate: string | null;
  error: string | null;
}

interface DataSourcesStatus {
  coingecko: DataSource;
  coinmarketcap: DataSource;
  airdropalert: DataSource;
  cryptonews: DataSource;
  nftevening: DataSource;
  playtoearn: DataSource;
}

interface DataSourceStatusProps {
  children: React.ReactNode;
}

export default function DataSourceStatus({ children }: DataSourceStatusProps) {
  const [status, setStatus] = useState<DataSourcesStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/data-sources/status');
      if (response.ok) {
        const statusData = await response.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Failed to load data source status:', error);
    }
  };

  const getSourceDisplayName = (key: string) => {
    const names: Record<string, string> = {
      coingecko: 'CoinGecko',
      coinmarketcap: 'CoinMarketCap',
      airdropalert: 'AirdropAlert',
      cryptonews: 'CryptoNews',
      nftevening: 'NFT Evening',
      playtoearn: 'PlayToEarn'
    };
    return names[key] || key;
  };

  const getStatusIcon = (source: DataSource) => {
    if (source.active) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (source.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (source: DataSource) => {
    if (source.active) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
    } else if (source.error) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
    } else {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Inactive</Badge>;
    }
  };

  const formatLastUpdate = (lastUpdate: string | null) => {
    if (!lastUpdate) return 'Never';
    
    const date = new Date(lastUpdate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  const activeCount = status ? Object.values(status).filter(s => s.active).length : 0;
  const totalCount = 6;

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-2"
      >
        {children}
        <Activity className="h-4 w-4 text-crypto-blue" />
        <Badge variant="outline" className="text-xs">
          {activeCount}/{totalCount}
        </Badge>
      </div>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 bg-crypto-card border-gray-600 text-white z-50 shadow-xl">
          <CardHeader className="border-b border-gray-600">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-crypto-blue" />
                Data Sources
              </span>
              <Badge variant="outline">
                {activeCount}/{totalCount} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4">
            {status ? (
              <div className="space-y-3">
                {Object.entries(status).map(([key, source]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-crypto-dark rounded-lg border border-gray-600">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(source)}
                      <div>
                        <div className="font-medium text-sm">
                          {getSourceDisplayName(key)}
                        </div>
                        {source.error && (
                          <div className="text-xs text-red-400 mt-1">
                            {source.error}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          Last: {formatLastUpdate(source.lastUpdate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(source)}
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 text-xs text-gray-400 text-center">
                  Auto-refreshes every 30 seconds
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                Loading status...
              </div>
            )}
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