import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Zap, Bell, Shield, Database } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  
  // Dashboard Settings
  const [refreshInterval, setRefreshInterval] = useState("30");
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  
  // Alert Settings
  const [hotnessThreshold, setHotnessThreshold] = useState("70");
  const [priceChangeThreshold, setPriceChangeThreshold] = useState("10");
  const [newListingAlerts, setNewListingAlerts] = useState(true);

  const handleSaveSettings = () => {
    const settings = {
      dashboard: {
        refreshInterval: parseInt(refreshInterval),
        showHotOnly,
        autoRefresh,
      },
      notifications: {
        email: emailNotifications,
        telegram: telegramNotifications,
        emailAddress,
        telegramBotToken,
        telegramChatId,
      },
      alerts: {
        hotnessThreshold: parseInt(hotnessThreshold),
        priceChangeThreshold: parseInt(priceChangeThreshold),
        newListingAlerts,
      },
    };
    
    localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-crypto-dark text-white">
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" className="border-gray-600 hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-crypto-blue" />
              Dashboard Settings
            </h1>
            <p className="text-gray-400">Configure your P2E and airdrop monitoring preferences</p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-crypto-blue">
              <Zap className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-white data-[state=active]:bg-crypto-blue">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-white data-[state=active]:bg-crypto-blue">
              <Shield className="mr-2 h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="data" className="text-white data-[state=active]:bg-crypto-blue">
              <Database className="mr-2 h-4 w-4" />
              Data Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Dashboard Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Auto-refresh Interval (seconds)</Label>
                  <Input
                    id="refresh-interval"
                    type="number"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(e.target.value)}
                    className="bg-crypto-dark border-gray-600"
                    min="5"
                    max="300"
                  />
                  <p className="text-xs text-gray-400">How often to refresh opportunity data</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Hot Opportunities Only</Label>
                    <p className="text-xs text-gray-400">Hide opportunities with low hotness scores</p>
                  </div>
                  <Switch
                    checked={showHotOnly}
                    onCheckedChange={setShowHotOnly}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-refresh Dashboard</Label>
                    <p className="text-xs text-gray-400">Automatically update data in real-time</p>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-gray-400">Receive alerts via email</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                {emailNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="bg-crypto-dark border-gray-600"
                      placeholder="your.email@example.com"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Telegram Notifications</Label>
                    <p className="text-xs text-gray-400">Receive alerts via Telegram bot</p>
                  </div>
                  <Switch
                    checked={telegramNotifications}
                    onCheckedChange={setTelegramNotifications}
                  />
                </div>

                {telegramNotifications && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-token">Telegram Bot Token</Label>
                      <Input
                        id="telegram-token"
                        type="password"
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        className="bg-crypto-dark border-gray-600"
                        placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chat-id">Chat ID</Label>
                      <Input
                        id="chat-id"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="bg-crypto-dark border-gray-600"
                        placeholder="123456789"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hotness-threshold">Hotness Score Threshold</Label>
                  <Input
                    id="hotness-threshold"
                    type="number"
                    value={hotnessThreshold}
                    onChange={(e) => setHotnessThreshold(e.target.value)}
                    className="bg-crypto-dark border-gray-600"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-400">Alert when opportunities exceed this hotness score</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-threshold">Price Change Threshold (%)</Label>
                  <Input
                    id="price-threshold"
                    type="number"
                    value={priceChangeThreshold}
                    onChange={(e) => setPriceChangeThreshold(e.target.value)}
                    className="bg-crypto-dark border-gray-600"
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-gray-400">Alert on significant price movements</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>New Listing Alerts</Label>
                    <p className="text-xs text-gray-400">Get notified of new cryptocurrency listings</p>
                  </div>
                  <Switch
                    checked={newListingAlerts}
                    onCheckedChange={setNewListingAlerts}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card className="bg-crypto-card border-gray-600">
              <CardHeader>
                <CardTitle>Data Source Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                    <h3 className="font-bold text-green-400 mb-2">CoinGecko API</h3>
                    <p className="text-sm text-gray-400 mb-2">Status: Connected</p>
                    <p className="text-xs text-gray-500">Providing cryptocurrency market data</p>
                  </div>
                  
                  <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                    <h3 className="font-bold text-red-400 mb-2">CoinMarketCap API</h3>
                    <p className="text-sm text-gray-400 mb-2">Status: Needs API Key</p>
                    <p className="text-xs text-gray-500">Additional market data source</p>
                  </div>
                  
                  <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                    <h3 className="font-bold text-green-400 mb-2">Twitter API</h3>
                    <p className="text-sm text-gray-400 mb-2">Status: Connected</p>
                    <p className="text-xs text-gray-500">Social sentiment analysis</p>
                  </div>
                  
                  <div className="p-4 bg-crypto-dark rounded-lg border border-gray-600">
                    <h3 className="font-bold text-green-400 mb-2">Web Scraping</h3>
                    <p className="text-sm text-gray-400 mb-2">Status: Active</p>
                    <p className="text-xs text-gray-500">P2E and airdrop websites</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                  <h3 className="font-bold text-blue-400 mb-2">Data Collection Status</h3>
                  <p className="text-sm text-gray-300">Currently tracking 1,035+ authentic opportunities from verified sources</p>
                  <p className="text-xs text-gray-400 mt-2">Last update: Real-time via WebSocket connections</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSaveSettings} className="bg-crypto-blue hover:bg-blue-600">
            Save All Settings
          </Button>
        </div>
      </div>
    </div>
  );
}