import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import DepartmentDashboard from "@/pages/department-dashboard";
import LocalDashboard from "@/pages/local-dashboard";
import Animals from "@/pages/animals";
import MapView from "@/pages/map";
import Chat from "@/pages/chat";
import SafariBooking from "@/pages/safari-booking";
import Bookings from "@/pages/bookings";
import TigerTracker from "@/pages/tiger-tracker";
import SafeZones from "@/pages/safe-zones";
import SurveillanceDashboard from "@/pages/surveillance";
import DetectionDetail from "@/pages/surveillance/detection-detail";
import AnalyticsDashboard from "@/pages/analytics";
import SettingsPage from "@/pages/settings";

function Router() {
  const { isAuthenticated, isLoading, isDepartment } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          {isDepartment ? (
            <>
              <Route path="/" component={DepartmentDashboard} />
              <Route path="/animals" component={Animals} />
              <Route path="/map" component={MapView} />
              <Route path="/chat" component={Chat} />
              <Route path="/bookings" component={Bookings} />
              <Route path="/surveillance" component={SurveillanceDashboard} />
              <Route path="/surveillance/detection/:id" component={DetectionDetail} />
              <Route path="/analytics" component={AnalyticsDashboard} />
              <Route path="/settings" component={SettingsPage} />
            </>
          ) : (
            <>
              <Route path="/" component={LocalDashboard} />
              <Route path="/safe-zones" component={SafeZones} />
              <Route path="/tigers" component={TigerTracker} />
              <Route path="/chat" component={Chat} />
              <Route path="/safari" component={SafariBooking} />
              <Route path="/surveillance" component={SurveillanceDashboard} />
              <Route path="/surveillance/detection/:id" component={DetectionDetail} />
              <Route path="/analytics" component={AnalyticsDashboard} />
              <Route path="/settings" component={SettingsPage} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Connect to WebSocket for real-time alerts when authenticated
  useWebSocket({ isAuthenticated });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
