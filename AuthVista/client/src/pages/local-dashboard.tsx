import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Shield, PawPrint, AlertTriangle, Calendar, MapPin, TreePine, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import type { Animal, Alert, SafariBooking } from "@shared/schema";

export default function LocalDashboard() {
  const { user } = useAuth();
  
  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/my"],
  });

  const { data: bookings = [] } = useQuery<SafariBooking[]>({
    queryKey: ["/api/bookings/my"],
  });

  const nearbyAnimals = animals.filter(a => a.status === 'active' && a.lastSeenLat);
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.date) > new Date()
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 font-quicksand">
            <TreePine className="h-10 w-10 text-primary" />
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary/70" />
            Stay safe and informed about wildlife in your area
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nearby Wildlife</CardTitle>
            <PawPrint className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-nearby-animals">
              {nearbyAnimals.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Animals tracked nearby
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-unread-alerts">
              {unreadAlerts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unread proximity alerts
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Zones</CardTitle>
            <Shield className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              Grazing areas protected
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-bookings">
              {upcomingBookings.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Upcoming safari tours
            </p>
          </CardContent>
        </GlassCard>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <GlassCard strength="light">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Alerts</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/safe-zones">View Map</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts yet. You'll be notified when wildlife is nearby.
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      alert.isRead ? 'bg-background/30' : 'bg-destructive/5'
                    } hover-elevate`}
                    data-testid={`alert-item-${alert.id}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      alert.isRead ? 'bg-muted' : 'bg-destructive/20'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        alert.isRead ? 'text-muted-foreground' : 'text-destructive'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.animalName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.createdAt && new Date(alert.createdAt).toLocaleString()} • {alert.distance?.toFixed(1)} km away
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/safe-zones">
              <Button 
                className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20 border-0"
                variant="outline"
                data-testid="button-view-safe-zones"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View Safe Grazing Zones
              </Button>
            </Link>
            <Link href="/tigers">
              <Button 
                className="w-full justify-start bg-orange/10 text-orange hover:bg-orange/20 border-0"
                variant="outline"
                data-testid="button-tiger-tracker"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                Tiger Family Tracker
              </Button>
            </Link>
            <Link href="/chat">
              <Button 
                className="w-full justify-start bg-primary/10 text-primary hover:bg-primary/20 border-0"
                variant="outline"
                data-testid="button-ai-assistant"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </Button>
            </Link>
            <Link href="/safari">
              <Button 
                className="w-full justify-start bg-orange/10 text-orange hover:bg-orange/20 border-0"
                variant="outline"
                data-testid="button-book-safari"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Safari Tour
              </Button>
            </Link>
          </CardContent>
        </GlassCard>
      </div>

      {/* Wildlife Safety Tips */}
      <GlassCard strength="medium" glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-primary" />
            Wildlife Safety Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Always graze cattle in designated safe zones marked in green on the map</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange mt-0.5 shrink-0" />
              <span>Act immediately when you receive proximity alerts - move to safe areas</span>
            </li>
            <li className="flex items-start gap-2">
              <PawPrint className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>Never approach wildlife. Maintain safe distance and contact forest department</span>
            </li>
          </ul>
        </CardContent>
      </GlassCard>
    </div>
  );
}
