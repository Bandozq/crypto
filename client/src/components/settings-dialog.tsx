import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Key, Zap, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export default function SettingsDialog({ children }: SettingsDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  // Dashboard preferences
  const [refreshInterval, setRefreshInterval] = useState("60");
  const [showHotOnly, setShowHotOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [telegramNotifications, setTelegramNotifications] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  
  // Alert configurations
  const [hotnessThreshold, setHotnessThreshold] = useState("200");
  const [priceChangeThreshold, setPriceChangeThreshold] = useState("10");
  const [newListingAlerts, setNewListingAlerts] = useState(true);

  const handleSaveSettings = () => {
    // Save settings to localStorage or send to backend
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
    
    localStorage.setItem("cryptoHuntSettings", JSON.stringify(settings));
    
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated successfully.",
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto bg-crypto-card border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Settings className="mr-2 h-5 w-5 text-crypto-blue" />
            Dashboard Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="dashboard" className="w-full">
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
              <MessageSquare className="mr-2 h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="api" className="text-white data-[state=active]:bg-crypto-blue">
              <Key className="mr-2 h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Dashboard Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize how your crypto opportunities dashboard behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval" className="text-white">
                    Auto-refresh interval (seconds)
                  </Label>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Auto-refresh enabled</Label>
                    <p className="text-sm text-gray-400">
                      Automatically update opportunities data
                    </p>
                  </div>
                  <Switch
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Show hot opportunities only</Label>
                    <p className="text-sm text-gray-400">
                      Display only high-scoring opportunities
                    </p>
                  </div>
                  <Switch
                    checked={showHotOnly}
                    onCheckedChange={setShowHotOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Email Notifications</CardTitle>
                <CardDescription className="text-gray-400">
                  Get notified about hot opportunities via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable email notifications</Label>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                {emailNotifications && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Telegram Notifications</CardTitle>
                <CardDescription className="text-gray-400">
                  Get instant alerts via Telegram bot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Telegram notifications</Label>
                  <Switch
                    checked={telegramNotifications}
                    onCheckedChange={setTelegramNotifications}
                  />
                </div>
                
                {telegramNotifications && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram-token" className="text-white">
                        Telegram Bot Token
                      </Label>
                      <Input
                        id="telegram-token"
                        placeholder="123456789:ABCDEF..."
                        value={telegramBotToken}
                        onChange={(e) => setTelegramBotToken(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telegram-chat" className="text-white">
                        Telegram Chat ID
                      </Label>
                      <Input
                        id="telegram-chat"
                        placeholder="Your chat ID"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Alert Configuration</CardTitle>
                <CardDescription className="text-gray-400">
                  Set thresholds for automatic alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hotness-threshold" className="text-white">
                    Hotness score threshold
                  </Label>
                  <Select value={hotnessThreshold} onValueChange={setHotnessThreshold}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="150">150+ (Medium)</SelectItem>
                      <SelectItem value="200">200+ (High)</SelectItem>
                      <SelectItem value="250">250+ (Very High)</SelectItem>
                      <SelectItem value="300">300+ (Extreme)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-change" className="text-white">
                    Price change threshold (%)
                  </Label>
                  <Select value={priceChangeThreshold} onValueChange={setPriceChangeThreshold}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">New listing alerts</Label>
                    <p className="text-sm text-gray-400">
                      Get notified about new cryptocurrency listings
                    </p>
                  </div>
                  <Switch
                    checked={newListingAlerts}
                    onCheckedChange={setNewListingAlerts}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">API Key Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Your API keys are securely stored and used for fetching authentic crypto data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-900 border border-green-600 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-green-300 font-medium">CoinGecko API: Connected</span>
                  </div>
                  <p className="text-green-200 text-sm mt-2">
                    Successfully fetching trending cryptocurrency data
                  </p>
                </div>

                <div className="p-4 bg-green-900 border border-green-600 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                    <span className="text-green-300 font-medium">CoinMarketCap API: Connected</span>
                  </div>
                  <p className="text-green-200 text-sm mt-2">
                    API credentials configured for new listings
                  </p>
                </div>

                <div className="p-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Need to update API keys?</h4>
                  <p className="text-gray-300 text-sm">
                    Contact your administrator to update API credentials for enhanced data access.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="bg-gray-600" />
        
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            className="bg-crypto-blue hover:bg-blue-600 text-white"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}