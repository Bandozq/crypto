import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import OpportunitiesPage from "@/pages/opportunities";
import AirdropsPage from "@/pages/airdrops";
import NewTodayPage from "@/pages/new-today";
import AnalyticsPage from "@/pages/analytics";
import TrendAnalysisPage from "@/pages/trend-analysis";
import SocialSentimentPage from "@/pages/social-sentiment";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/opportunities" component={OpportunitiesPage} />
      <Route path="/airdrops" component={AirdropsPage} />
      <Route path="/new-today" component={NewTodayPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/trend-analysis" component={TrendAnalysisPage} />
      <Route path="/social-sentiment" component={SocialSentimentPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-crypto-dark text-white">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
