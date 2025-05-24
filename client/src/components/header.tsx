import { Rocket, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  stats?: {
    totalOpportunities: number;
    activeAirdrops: number;
    newListings: number;
    p2eGames?: number;
    totalValue?: number;
  };
}

export default function Header({ stats }: HeaderProps) {
  return (
    <header className="bg-crypto-card border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="text-crypto-blue text-2xl" />
              <h1 className="text-xl font-bold text-white">CryptoHunt</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-crypto-green bg-opacity-20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-crypto-green rounded-full animate-pulse"></div>
              <span className="text-sm text-crypto-green font-medium">Live Updates</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-crypto-blue font-semibold">
                  {stats?.totalOpportunities?.toLocaleString() || '0'}
                </div>
                <div className="text-gray-400 text-xs">Opportunities</div>
              </div>
              <div className="text-center">
                <div className="text-crypto-green font-semibold">
                  {stats?.activeAirdrops || '0'}
                </div>
                <div className="text-gray-400 text-xs">Active Airdrops</div>
              </div>
              <div className="text-center">
                <div className="text-crypto-yellow font-semibold">
                  {stats?.newListings || '0'}
                </div>
                <div className="text-gray-400 text-xs">New Today</div>
              </div>
            </div>
            <Button className="bg-crypto-blue hover:bg-blue-600 px-4 py-2 text-sm font-medium">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
