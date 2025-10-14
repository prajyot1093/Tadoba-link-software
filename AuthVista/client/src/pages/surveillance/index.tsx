import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, AlertTriangle, Activity, Shield, Plus, TreePine, Leaf } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3 font-quicksand">
            <TreePine className="h-10 w-10 text-primary drop-shadow-lg" />
            AI Surveillance System
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary/70" />
            Real-time wildlife conservation monitoring with YOLO detection
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/surveillance/real-time">
            <Button className="glass-button gap-2 h-11 px-6" variant="default">
              <Camera className="h-4 w-4" />
              Live Webcam
            </Button>
          </Link>
          <Button className="glass-button gap-2 h-11 px-6" onClick={() => setAddCameraOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Camera
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <GlassCard strength="medium" glow>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/90">Active Cameras</CardTitle>
              <Camera className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{activeCameras}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {cameras.length} total cameras
              </p>
            </CardContent>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <GlassCard strength="medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/90">Today's Detections</CardTitle>
              <Activity className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{todayDetections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {detections.length} total detections
              </p>
            </CardContent>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <GlassCard strength="medium" className="border-destructive/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/90">Critical Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{criticalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requires immediate action
              </p>
            </CardContent>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <GlassCard strength="medium" glow>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground/90">System Status</CardTitle>
              <Shield className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">Online</div>
              <p className="text-xs text-muted-foreground mt-1">
                All systems operational
              </p>
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>

      {/* Map Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <SurveillanceMap 
          cameras={cameras}
          detections={detections}
          selectedCamera={selectedCamera}
          onCameraSelect={setSelectedCamera}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Grid */}
        <div className="lg:col-span-2">
          <GlassCard strength="strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Camera className="h-5 w-5 text-primary" />
                Camera Network
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Monitor all surveillance cameras across Tadoba reserve
              </CardDescription>
            </CardHeader>
            <CardContent>
              {camerasLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading cameras...</div>
              ) : cameras.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No cameras registered yet</p>
                  <Button className="mt-4 glass-button" onClick={() => setAddCameraOpen(true)}>
                    Add Your First Camera
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cameras.map((camera, idx) => (
                    <motion.div
                      key={camera.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Card 
                        className={`glass-card cursor-pointer transition-all hover:border-primary/50 ${
                          selectedCamera === camera.id ? 'ring-2 ring-primary border-primary/70' : ''
                        }`}
                        onClick={() => setSelectedCamera(camera.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Camera className="h-5 w-5 text-primary" />
                              <h3 className="font-semibold text-lg text-foreground">{camera.name}</h3>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(camera.status)} shadow-lg`} />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                            <Leaf className="h-3 w-3 text-primary/60" />
                            {camera.location}
                          </p>
                          {camera.zone && (
                            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                              Zone: {camera.zone}
                            </Badge>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground/70 space-y-1">
                            <div>Lat: {camera.latitude.toFixed(4)}, Lng: {camera.longitude.toFixed(4)}</div>
                            <div className="capitalize">Status: <span className="font-medium text-foreground/80">{camera.status}</span></div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>

        {/* Detection Timeline */}
        <div className="lg:col-span-1">
          <GlassCard strength="strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Activity className="h-5 w-5 text-secondary" />
                Recent Detections
              </CardTitle>
              <CardDescription className="text-muted-foreground/80">
                Latest YOLO detections from all cameras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading detections...</div>
              ) : detections.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No detections yet</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Upload images to start</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {detections.map((detection, idx) => {
                    const camera = cameras.find(c => c.id === detection.camera_id);
                    const objectTypes = Array.from(new Set(detection.detected_objects.map(o => o.class)));
                    
                    return (
                      <Link key={detection.id} href={`/surveillance/detection/${detection.id}`}>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card className="glass-card p-3 cursor-pointer hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={getThreatColor(detection.threat_level)}>
                                {detection.threat_level.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground/70">
                                {formatTimeAgo(detection.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
                              <Camera className="h-4 w-4 text-primary/70" />
                              {camera?.name || 'Unknown Camera'}
                            </p>
                            <div className="text-xs text-muted-foreground/80">
                              <div className="mb-2">
                                <strong className="text-foreground">{detection.detection_count}</strong> objects detected
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {objectTypes.map(type => (
                                  <Badge key={type} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {detection.threat_level === 'critical' && (
                              <div className="mt-2 p-2 backdrop-blur-sm bg-destructive/10 border border-destructive/30 rounded-lg text-xs text-destructive font-medium">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                Weapon detected - Immediate action required!
                              </div>
                            )}
                          </Card>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </GlassCard>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <GlassCard strength="medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Leaf className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="h-20 w-full flex-col gap-2 glass-card border-primary/20 hover:border-primary/50" onClick={() => setAddCameraOpen(true)}>
                  <Camera className="h-6 w-6 text-primary" />
                  <span className="text-sm">Add Camera</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="h-20 w-full flex-col gap-2 glass-card border-secondary/20 hover:border-secondary/50" onClick={() => setUploadImageOpen(true)}>
                  <Activity className="h-6 w-6 text-secondary" />
                  <span className="text-sm">Upload Image</span>
                </Button>
              </motion.div>
              <Link href="/analytics">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
                  <Button variant="outline" className="h-20 w-full flex-col gap-2 glass-card border-primary/20 hover:border-primary/50">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" className="h-20 w-full flex-col gap-2 glass-card border-destructive/20 hover:border-destructive/50">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <span className="text-sm">View Alerts</span>
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </GlassCard>
      </motion.div>

      {/* Add Camera Modal */}
      <AddCameraModal open={addCameraOpen} onOpenChange={setAddCameraOpen} />
      
      {/* Upload Image Modal */}
      <UploadImageModal open={uploadImageOpen} onOpenChange={setUploadImageOpen} />
    </div>
  );
}
