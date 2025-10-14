import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Download, TreePine, Leaf } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface Detection {
  id: string;
  camera_id: string;
  detected_objects: Array<{
    class: string;
    confidence: number;
  }>;
  detection_count: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface Camera {
  id: string;
  name: string;
  location: string;
}

export default function AnalyticsDashboard() {
  // Fetch detections for analytics
  const { data: detections = [], isLoading } = useQuery<Detection[]>({
    queryKey: ['analytics-detections'],
    queryFn: async () => {
      const res = await fetch('/api/surveillance/detections?limit=1000', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch detections');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['analytics-cameras'],
    queryFn: async () => {
      const res = await fetch('/api/surveillance/cameras', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch cameras');
      return res.json();
    },
  });

  // Process data for charts
  const processDetectionTrends = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(startOfDay(date), 'MMM dd'),
        fullDate: startOfDay(date),
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
    });

    detections.forEach(detection => {
      const detectionDate = startOfDay(new Date(detection.timestamp));
      const dayData = last7Days.find(
        day => day.fullDate.getTime() === detectionDate.getTime()
      );
      if (dayData) {
        dayData.total++;
        dayData[detection.threat_level]++;
      }
    });

    return last7Days.map(({ fullDate, ...rest }) => rest);
  };

  const processThreatDistribution = () => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    detections.forEach(detection => {
      counts[detection.threat_level]++;
    });

    return [
      { name: 'Critical', value: counts.critical, color: '#dc2626' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'Low', value: counts.low, color: '#22c55e' },
    ].filter(item => item.value > 0);
  };

  const processTopCameras = () => {
    const cameraCounts = new Map<string, number>();
    
    detections.forEach(detection => {
      const count = cameraCounts.get(detection.camera_id) || 0;
      cameraCounts.set(detection.camera_id, count + 1);
    });

    return Array.from(cameraCounts.entries())
      .map(([cameraId, count]) => {
        const camera = cameras.find(c => c.id === cameraId);
        return {
          name: camera?.name || 'Unknown',
          location: camera?.location || '',
          detections: count,
        };
      })
      .sort((a, b) => b.detections - a.detections)
      .slice(0, 5);
  };

  const processObjectTypes = () => {
    const objectCounts = new Map<string, number>();

    detections.forEach(detection => {
      detection.detected_objects.forEach(obj => {
        const count = objectCounts.get(obj.class) || 0;
        objectCounts.set(obj.class, count + 1);
      });
    });

    return Array.from(objectCounts.entries())
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const processHourlyActivity = () => {
    const hourly = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      detections: 0,
    }));

    detections.forEach(detection => {
      const hour = new Date(detection.timestamp).getHours();
      hourly[hour].detections++;
    });

    return hourly;
  };

  const trendData = processDetectionTrends();
  const threatData = processThreatDistribution();
  const topCamerasData = processTopCameras();
  const objectTypesData = processObjectTypes();
  const hourlyData = processHourlyActivity();

  const stats = {
    totalDetections: detections.length,
    criticalAlerts: detections.filter(d => d.threat_level === 'critical').length,
    avgPerDay: (detections.length / 7).toFixed(1),
    weaponsDetected: detections.filter(d => 
      d.detected_objects.some(obj => obj.class === 'weapon')
    ).length,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 font-quicksand">
            <TreePine className="h-10 w-10 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary/70" />
            Data-driven insights for wildlife conservation
          </p>
        </div>
        <Button className="glass-button gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            <TreePine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDetections}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires action</p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerDay}</div>
            <p className="text-xs text-muted-foreground mt-1">Detection rate</p>
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weapons Detected</CardTitle>
            <Leaf className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.weaponsDetected}</div>
            <p className="text-xs text-muted-foreground mt-1">High priority</p>
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Trends */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Detection Trends (7 Days)
            </CardTitle>
            <CardDescription>Daily detection counts by threat level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} name="Critical" />
                <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={2} name="High" />
                <Line type="monotone" dataKey="medium" stroke="#eab308" strokeWidth={2} name="Medium" />
                <Line type="monotone" dataKey="low" stroke="#22c55e" strokeWidth={2} name="Low" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>

        {/* Threat Distribution */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Threat Level Distribution
            </CardTitle>
            <CardDescription>Breakdown of threats by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>

        {/* Top Cameras */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top 5 Cameras
            </CardTitle>
            <CardDescription>Most active surveillance cameras</CardDescription>
          </CardHeader>
          <CardContent>
            {topCamerasData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCamerasData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="detections" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No camera data available
              </div>
            )}
          </CardContent>
        </GlassCard>

        {/* Object Types */}
        <GlassCard strength="light">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Detected Object Types
            </CardTitle>
            <CardDescription>Most frequently detected objects</CardDescription>
          </CardHeader>
          <CardContent>
            {objectTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={objectTypesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No detection data available
              </div>
            )}
          </CardContent>
        </GlassCard>
      </div>

      {/* Hourly Activity Heatmap */}
      <GlassCard strength="light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            24-Hour Activity Pattern
          </CardTitle>
          <CardDescription>Detection activity by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="detections" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Insights */}
      <GlassCard strength="medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 glass-card rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TreePine className="h-4 w-4 text-primary" />
                Peak Activity
              </h4>
              <p className="text-sm text-muted-foreground">
                Most detections occur during{' '}
                <strong className="text-foreground">
                  {hourlyData.reduce((max, hour) => 
                    hour.detections > max.detections ? hour : max
                  ).hour}
                </strong>
              </p>
            </div>
            <div className="p-4 glass-card rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Detection Rate
              </h4>
              <p className="text-sm text-muted-foreground">
                Average of <strong className="text-foreground">{stats.avgPerDay}</strong> detections per day over the last week
              </p>
            </div>
            <div className="p-4 glass-card rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-500" />
                Security Threats
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong className="text-red-500">{stats.weaponsDetected}</strong> weapon detections require immediate attention
              </p>
            </div>
            <div className="p-4 glass-card rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                Camera Coverage
              </h4>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{cameras.length}</strong> cameras deployed across Tadoba reserve
              </p>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
