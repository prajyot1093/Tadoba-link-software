import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ForestParticles } from "@/components/ui/forest-background";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useWebVitals } from "@/lib/web-vitals";
import NotFound from "@/pages/not-found";

// Lazy-loaded route components for better code splitting
const Landing = lazy(() => import("@/pages/landing"));
const DepartmentDashboard = lazy(() => import("@/pages/department-dashboard"));
const LocalDashboard = lazy(() => import("@/pages/local-dashboard"));
const Animals = lazy(() => import("@/pages/animals"));
const MapView = lazy(() => import("@/pages/map"));
const Chat = lazy(() => import("@/pages/chat"));
const SafariBooking = lazy(() => import("@/pages/safari-booking"));
const Bookings = lazy(() => import("@/pages/bookings"));
const TigerTracker = lazy(() => import("@/pages/tiger-tracker"));
const SafeZones = lazy(() => import("@/pages/safe-zones"));
const SurveillanceDashboard = lazy(() => import("@/pages/surveillance"));
const DetectionDetail = lazy(() => import("@/pages/surveillance/detection-detail"));
const SurveillanceRealTime = lazy(() => import("@/pages/surveillance/real-time"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics"));
const SettingsPage = lazy(() => import("@/pages/settings"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading, isDepartment } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
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
                <Route path="/surveillance/real-time" component={SurveillanceRealTime} />
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
              <Route path="/surveillance/real-time" component={SurveillanceRealTime} />
              <Route path="/surveillance/detection/:id" component={DetectionDetail} />
              <Route path="/analytics" component={AnalyticsDashboard} />
              <Route path="/settings" component={SettingsPage} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Connect to WebSocket for real-time alerts when authenticated
  useWebSocket({ isAuthenticated });
  
  // Track Web Vitals for performance monitoring
  useWebVitals();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading || !isAuthenticated) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      {/* Forest background for authenticated pages */}
      <div className="forest-background" />
      <ForestParticles />
      <div className="mist-overlay" />
      
      <div className="flex h-screen w-full relative z-20">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border/30 glass-card-strong">
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
