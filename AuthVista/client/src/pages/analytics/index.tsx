import { useQuery } from '@tanstack/react-query';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive surveillance data analysis and insights
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDetections}</div>
            <p className="text-xs text-gray-600 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalAlerts}</div>
            <p className="text-xs text-gray-600 mt-1">Requires action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPerDay}</div>
            <p className="text-xs text-gray-600 mt-1">Detection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weapons Detected</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.weaponsDetected}</div>
            <p className="text-xs text-gray-600 mt-1">High priority</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
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
        </Card>

        {/* Threat Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
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
        </Card>

        {/* Top Cameras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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
                  <Bar dataKey="detections" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No camera data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Object Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
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
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No detection data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
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
              <Bar dataKey="detections" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Peak Activity</h4>
              <p className="text-sm text-blue-800">
                Most detections occur during{' '}
                <strong>
                  {hourlyData.reduce((max, hour) => 
                    hour.detections > max.detections ? hour : max
                  ).hour}
                </strong>
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Detection Rate</h4>
              <p className="text-sm text-green-800">
                Average of <strong>{stats.avgPerDay}</strong> detections per day over the last week
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Security Threats</h4>
              <p className="text-sm text-red-800">
                <strong>{stats.weaponsDetected}</strong> weapon detections require immediate attention
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Camera Coverage</h4>
              <p className="text-sm text-purple-800">
                <strong>{cameras.length}</strong> cameras deployed across Tadoba reserve
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
