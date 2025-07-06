import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}

interface PriceAlertsProps {
  children: React.ReactNode;
}

export default function PriceAlerts({ children }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    targetPrice: '',
    condition: 'above' as 'above' | 'below'
  });
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load existing alerts
  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const alertsData = await response.json();
        setAlerts(alertsData);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const createAlert = async () => {
    if (!newAlert.symbol || !newAlert.targetPrice) {
      toast({
        title: "Missing Information",
        description: "Please enter both symbol and target price",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(newAlert),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Price Alert Created",
          description: `Alert set for ${newAlert.symbol.toUpperCase()} ${newAlert.condition} $${newAlert.targetPrice}`,
        });
        
        setNewAlert({ symbol: '', targetPrice: '', condition: 'above' });
        loadAlerts();
      }
    } catch (error) {
      toast({
        title: "Failed to Create Alert",
        description: "Please try again",
        variant: "destructive"
      });
    }
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
              <Bell className="h-5 w-5 text-crypto-blue" />
              Price Alerts
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Create New Alert */}
            <div className="space-y-3 p-3 bg-crypto-dark rounded-lg border border-gray-600">
              <h4 className="font-medium text-sm">Create New Alert</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="symbol" className="text-xs text-gray-300">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="BTC, ETH..."
                    value={newAlert.symbol}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    className="bg-gray-700 border-gray-500 text-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price" className="text-xs text-gray-300">Target Price</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={newAlert.targetPrice}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, targetPrice: e.target.value }))}
                    className="bg-gray-700 border-gray-500 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-300">Condition</Label>
                <Select 
                  value={newAlert.condition} 
                  onValueChange={(value: 'above' | 'below') => setNewAlert(prev => ({ ...prev, condition: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-crypto-dark border-gray-600">
                    <SelectItem value="above" className="text-white">Price goes above</SelectItem>
                    <SelectItem value="below" className="text-white">Price goes below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={createAlert} 
                className="w-full bg-crypto-blue hover:bg-blue-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Alert
              </Button>
            </div>

            {/* Active Alerts */}
            <div>
              <h4 className="font-medium text-sm mb-2">Active Alerts ({alerts.length})</h4>
              
              {alerts.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No price alerts set</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.symbol}
                          </Badge>
                          <span className="text-sm">
                            {alert.condition} ${alert.targetPrice}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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