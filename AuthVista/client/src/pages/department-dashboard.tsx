import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { PawPrint, MapPin, AlertTriangle, TrendingUp, Upload, TreePine, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import type { Animal, Alert } from "@shared/schema";

export default function DepartmentDashboard() {
  const { data: animals = [], isLoading: loadingAnimals } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  const { data: recentAlerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/recent"],
  });

  const activeAnimals = animals.filter(a => a.status === 'active');
  const totalTracked = animals.length;
  const todayAlerts = recentAlerts.filter(a => {
    const today = new Date().toDateString();
    return a.createdAt && new Date(a.createdAt).toDateString() === today;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 font-quicksand">
            <TreePine className="h-10 w-10 text-primary" />
            Department Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary/70" />
            Wildlife monitoring and management
          </p>
        </div>
        <Link href="/animals">
          <Button className="glass-button gap-2" data-testid="button-add-animal">
            <Upload className="w-4 h-4" />
            Add Animal Data
          </Button>
        </Link>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <PawPrint className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-animals">
              {loadingAnimals ? "..." : totalTracked}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeAnimals.length} active trackers
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Locations</CardTitle>
            <MapPin className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-live-locations">
              {activeAnimals.filter(a => a.lastSeenLat).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              GPS tracked today
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Today</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-alerts-today">
              {todayAlerts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Proximity warnings sent
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conservation Rate</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Safety success rate
            </p>
          </CardContent>
        </GlassCard>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Animals */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              Recent Animal Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnimals ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : animals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No animals tracked yet. Add your first animal data.
              </div>
            ) : (
              <div className="space-y-3">
                {animals.slice(0, 5).map((animal) => (
                  <div
                    key={animal.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover-elevate"
                    data-testid={`animal-item-${animal.id}`}
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <PawPrint className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{animal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {animal.species} • {animal.lastSeenLocation || 'Location unknown'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      animal.status === 'active' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {animal.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Recent Alerts */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Recent Proximity Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts in the system yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover-elevate"
                  >
                    <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.animalName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.createdAt && new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>

      {/* Camera Feed Upload Section */}
      <GlassCard strength="medium" glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-primary" />
            AI Camera Feed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">Upload Camera Footage</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI will analyze footage for wildlife activity and potential threats
              </p>
            </div>
            <Button className="bg-orange" data-testid="button-upload-footage">
              <Upload className="w-4 h-4 mr-2" />
              Select Files
            </Button>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
