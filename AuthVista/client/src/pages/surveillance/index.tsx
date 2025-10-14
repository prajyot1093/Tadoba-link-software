import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, AlertTriangle, Activity, Shield, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddCameraModal } from '@/components/surveillance/add-camera-modal';
import { UploadImageModal } from '@/components/surveillance/upload-image-modal';
import { SurveillanceMap } from '@/components/surveillance/surveillance-map';
import { AlertBanner } from '@/components/surveillance/alert-banner';
import { Link } from 'wouter';

interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance';
  zone?: string;
  created_at: string;
  updated_at: string;
}

interface Detection {
  id: string;
  camera_id: string;
  image_url: string;
  detected_objects: Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
  detection_count: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export default function SurveillanceDashboard() {
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [addCameraOpen, setAddCameraOpen] = useState(false);
  const [uploadImageOpen, setUploadImageOpen] = useState(false);

  // Fetch cameras
  const { data: cameras = [], isLoading: camerasLoading } = useQuery<Camera[]>({
    queryKey: ['surveillance-cameras'],
    queryFn: async () => {
      const res = await fetch('/api/surveillance/cameras', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch cameras');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch recent detections
  const { data: detections = [], isLoading: detectionsLoading } = useQuery<Detection[]>({
    queryKey: ['surveillance-detections', selectedCamera],
    queryFn: async () => {
      const url = selectedCamera 
        ? `/api/surveillance/detections?camera_id=${selectedCamera}&limit=20`
        : '/api/surveillance/detections?limit=20';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch detections');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Calculate statistics
  const activeCameras = cameras.filter(c => c.status === 'active').length;
  const todayDetections = detections.filter(d => {
    const detectionDate = new Date(d.timestamp);
    const today = new Date();
    return detectionDate.toDateString() === today.toDateString();
  }).length;
  const criticalAlerts = detections.filter(d => d.threat_level === 'critical' || d.threat_level === 'high').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Real-time Alert Banner */}
      <AlertBanner cameras={cameras} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 AI Surveillance System</h1>
          <p className="text-gray-600 mt-1">
            Real-time wildlife conservation monitoring with YOLO detection
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddCameraOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Camera
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
            <Camera className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCameras}</div>
            <p className="text-xs text-gray-600 mt-1">
              {cameras.length} total cameras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Detections</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayDetections}</div>
            <p className="text-xs text-gray-600 mt-1">
              {detections.length} total detections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
            <p className="text-xs text-gray-600 mt-1">
              Requires immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-gray-600 mt-1">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Map Visualization */}
      <SurveillanceMap 
        cameras={cameras}
        detections={detections}
        selectedCamera={selectedCamera}
        onCameraSelect={setSelectedCamera}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>📹 Camera Network</CardTitle>
              <CardDescription>
                Monitor all surveillance cameras across Tadoba reserve
              </CardDescription>
            </CardHeader>
            <CardContent>
              {camerasLoading ? (
                <div className="text-center py-8 text-gray-500">Loading cameras...</div>
              ) : cameras.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No cameras registered yet</p>
                  <Button className="mt-4" onClick={() => setAddCameraOpen(true)}>
                    Add Your First Camera
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cameras.map((camera) => (
                    <Card 
                      key={camera.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedCamera === camera.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCamera(camera.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Camera className="h-5 w-5 text-gray-600" />
                            <h3 className="font-semibold text-lg">{camera.name}</h3>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)}`} />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">📍 {camera.location}</p>
                        {camera.zone && (
                          <Badge variant="outline" className="text-xs">
                            Zone: {camera.zone}
                          </Badge>
                        )}
                        <div className="mt-3 text-xs text-gray-500">
                          <div>Lat: {camera.latitude.toFixed(4)}, Lng: {camera.longitude.toFixed(4)}</div>
                          <div className="mt-1 capitalize">Status: {camera.status}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detection Timeline */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Recent Detections</CardTitle>
              <CardDescription>
                Latest YOLO detections from all cameras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionsLoading ? (
                <div className="text-center py-8 text-gray-500">Loading detections...</div>
              ) : detections.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No detections yet</p>
                  <p className="text-gray-500 text-xs mt-1">Upload images to start</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {detections.map((detection) => {
                    const camera = cameras.find(c => c.id === detection.camera_id);
                    const objectTypes = Array.from(new Set(detection.detected_objects.map(o => o.class)));
                    
                    return (
                      <Link key={detection.id} href={`/surveillance/detection/${detection.id}`}>
                        <Card className="p-3 cursor-pointer hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className={getThreatColor(detection.threat_level)}>
                              {detection.threat_level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(detection.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            {camera?.name || 'Unknown Camera'}
                          </p>
                          <div className="text-xs text-gray-600">
                            <div className="mb-1">
                              <strong>{detection.detection_count}</strong> objects detected
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {objectTypes.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {detection.threat_level === 'critical' && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                              ⚠️ Weapon detected - Immediate action required!
                            </div>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setAddCameraOpen(true)}>
              <Camera className="h-6 w-6" />
              <span className="text-sm">Add Camera</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setUploadImageOpen(true)}>
              <Activity className="h-6 w-6" />
              <span className="text-sm">Upload Image</span>
            </Button>
            <Link href="/analytics">
              <Button variant="outline" className="h-20 w-full flex-col gap-2">
                <Shield className="h-6 w-6" />
                <span className="text-sm">Analytics</span>
              </Button>
            </Link>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-sm">View Alerts</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Camera Modal */}
      <AddCameraModal open={addCameraOpen} onOpenChange={setAddCameraOpen} />
      
      {/* Upload Image Modal */}
      <UploadImageModal open={uploadImageOpen} onOpenChange={setUploadImageOpen} />
    </div>
  );
}
