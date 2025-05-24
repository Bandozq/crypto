import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
  wallet: string;
}

interface PortfolioIntegrationProps {
  children: React.ReactNode;
}

export default function PortfolioIntegration({ children }: PortfolioIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [newAsset, setNewAsset] = useState({
    symbol: '',
    amount: '',
    wallet: 'manual'
  });
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange, setTotalChange] = useState(0);
  const { toast } = useToast();

  // Load portfolio from localStorage
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('crypto-portfolio');
    if (savedPortfolio) {
      const portfolioData = JSON.parse(savedPortfolio);
      setPortfolio(portfolioData);
      calculateTotals(portfolioData);
    }
  }, []);

  const calculateTotals = (portfolioData: PortfolioAsset[]) => {
    const total = portfolioData.reduce((sum, asset) => sum + asset.value, 0);
    const totalChangeAmount = portfolioData.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);
    setTotalValue(total);
    setTotalChange(total > 0 ? (totalChangeAmount / total) * 100 : 0);
  };

  const addAsset = async () => {
    if (!newAsset.symbol || !newAsset.amount) {
      toast({
        title: "Missing Information",
        description: "Please enter both symbol and amount",
        variant: "destructive"
      });
      return;
    }

    // Simulate fetching price data (in real app, use CoinGecko API)
    const mockPriceData = {
      name: newAsset.symbol.toUpperCase(),
      value: Math.random() * 1000 + 10, // Random price for demo
      change24h: (Math.random() - 0.5) * 20 // Random change for demo
    };

    const asset: PortfolioAsset = {
      symbol: newAsset.symbol.toUpperCase(),
      name: mockPriceData.name,
      amount: parseFloat(newAsset.amount),
      value: mockPriceData.value * parseFloat(newAsset.amount),
      change24h: mockPriceData.change24h,
      wallet: newAsset.wallet
    };

    const updatedPortfolio = [...portfolio, asset];
    setPortfolio(updatedPortfolio);
    localStorage.setItem('crypto-portfolio', JSON.stringify(updatedPortfolio));
    calculateTotals(updatedPortfolio);

    setNewAsset({ symbol: '', amount: '', wallet: 'manual' });
    
    toast({
      title: "Asset Added",
      description: `${asset.amount} ${asset.symbol} added to portfolio`,
    });
  };

  const removeAsset = (index: number) => {
    const updatedPortfolio = portfolio.filter((_, i) => i !== index);
    setPortfolio(updatedPortfolio);
    localStorage.setItem('crypto-portfolio', JSON.stringify(updatedPortfolio));
    calculateTotals(updatedPortfolio);
  };

  const connectWallet = async (walletType: string) => {
    // Simulate wallet connection (in real app, integrate with MetaMask, WalletConnect, etc.)
    toast({
      title: "Wallet Connection",
      description: `To connect ${walletType}, you'll need to integrate the wallet's SDK. This demo shows the UI structure.`,
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {children}
      </div>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 bg-crypto-card border-gray-600 text-white z-50 shadow-xl">
          <CardHeader className="border-b border-gray-600">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-crypto-blue" />
              Portfolio Integration
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Portfolio Summary */}
            <div className="p-3 bg-crypto-dark rounded-lg border border-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(totalValue)}
                </div>
                <div className={`text-sm flex items-center justify-center gap-1 ${
                  totalChange >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {totalChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(totalChange).toFixed(2)}% (24h)
                </div>
              </div>
            </div>

            {/* Wallet Connections */}
            <div>
              <h4 className="font-medium text-sm mb-2">Connect Wallet</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectWallet('MetaMask')}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  MetaMask
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectWallet('WalletConnect')}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  WalletConnect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectWallet('Coinbase')}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Coinbase
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => connectWallet('Trust Wallet')}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  Trust Wallet
                </Button>
              </div>
            </div>

            {/* Manual Asset Entry */}
            <div className="space-y-3 p-3 bg-crypto-dark rounded-lg border border-gray-600">
              <h4 className="font-medium text-sm">Add Asset Manually</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="symbol" className="text-xs text-gray-300">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="BTC, ETH..."
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    className="bg-gray-700 border-gray-500 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount" className="text-xs text-gray-300">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, amount: e.target.value }))}
                    className="bg-gray-700 border-gray-500 text-white"
                  />
                </div>
              </div>
              
              <Button 
                onClick={addAsset} 
                className="w-full bg-crypto-blue hover:bg-blue-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Asset
              </Button>
            </div>

            {/* Portfolio Assets */}
            <div>
              <h4 className="font-medium text-sm mb-2">Portfolio Assets ({portfolio.length})</h4>
              
              {portfolio.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No assets in portfolio</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {portfolio.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {asset.symbol}
                          </Badge>
                          <span className="text-sm">
                            {asset.amount} × {formatCurrency(asset.value / asset.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium">
                            {formatCurrency(asset.value)}
                          </span>
                          <span className={`text-xs ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeAsset(index)}
                        className="h-8 w-8 p-0 hover:bg-red-600"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 text-center">
              Connect wallets or add assets to track portfolio performance
            </div>
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