import { Rocket, Settings, Bell, Activity, Wallet, BarChart3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import SettingsDialog from "@/components/settings-dialog";
import PriceAlerts from "./price-alerts";
import DataSourceStatus from "./data-source-status";
import PortfolioIntegration from "./portfolio-integration";
import AnalyticsDashboard from "./analytics-dashboard";
import TrendAnalysisDashboard from "./trend-analysis-dashboard";

interface HeaderProps {
  stats?: {
    totalOpportunities: number;
    activeAirdrops: number;
    newListings: number;
    p2eGames?: number;
    totalValue?: number;
  };
  opportunities?: any[];
}

export default function Header({ stats, opportunities = [] }: HeaderProps) {
  return (
    <header className="bg-crypto-card border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Rocket className="text-crypto-blue text-2xl" />
              <h1 className="text-xl font-bold text-white">CryptoHunt</h1>
            </div>
            <div className="hidden md:flex items-center space-x-2 bg-green-500 bg-opacity-20 px-3 py-1 rounded-full border border-green-500 border-opacity-30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300 font-semibold">Live Updates</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-6 text-sm">
              <Link href="/opportunities">
                <div className="text-center cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors">
                  <div className="text-crypto-blue font-semibold">
                    {stats?.totalOpportunities?.toLocaleString() || '0'}
                  </div>
                  <div className="text-gray-400 text-xs">Opportunities</div>
                </div>
              </Link>
              <Link href="/airdrops">
                <div className="text-center cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors">
                  <div className="text-crypto-green font-semibold">
                    {stats?.activeAirdrops || '0'}
                  </div>
                  <div className="text-gray-400 text-xs">Active Airdrops</div>
                </div>
              </Link>
              <Link href="/new-today">
                <div className="text-center cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors">
                  <div className="text-crypto-yellow font-semibold">
                    {stats?.newListings || '0'}
                  </div>
                  <div className="text-gray-400 text-xs">New Today</div>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {/* Portfolio Integration */}
              <PortfolioIntegration>
                <Button variant="outline" className="border-gray-600 hover:bg-gray-700 px-3 py-2 text-sm">
                  <Wallet className="h-4 w-4" />
                </Button>
              </PortfolioIntegration>

              {/* Analytics Dashboard */}
              <AnalyticsDashboard opportunities={opportunities}>
                <Button variant="outline" className="border-gray-600 hover:bg-gray-700 px-3 py-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </AnalyticsDashboard>

              {/* Trend Analysis Dashboard */}
              <TrendAnalysisDashboard>
                <Button variant="outline" className="border-gray-600 hover:bg-gray-700 px-3 py-2 text-sm">
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </TrendAnalysisDashboard>

              {/* Price Alerts */}
              <PriceAlerts>
                <Button variant="outline" className="border-gray-600 hover:bg-gray-700 px-3 py-2 text-sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </PriceAlerts>

              {/* Data Source Status */}
              <DataSourceStatus>
                <Button variant="outline" className="border-gray-600 hover:bg-gray-700 px-3 py-2 text-sm">
                  <Activity className="h-4 w-4" />
                </Button>
              </DataSourceStatus>

              <SettingsDialog>
                <Button className="bg-crypto-blue hover:bg-blue-600 px-4 py-2 text-sm font-medium">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </SettingsDialog>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
