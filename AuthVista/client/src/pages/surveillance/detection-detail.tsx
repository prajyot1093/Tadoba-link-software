import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft, Camera, Clock, MapPin, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

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

interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  zone?: string;
}

export default function DetectionDetail() {
  const [, params] = useRoute('/surveillance/detection/:id');
  const detectionId = params?.id;

  const { data: detection, isLoading: detectionLoading } = useQuery<Detection>({
    queryKey: ['detection', detectionId],
    queryFn: async () => {
      const res = await fetch(`/api/surveillance/detections/${detectionId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch detection');
      return res.json();
    },
    enabled: !!detectionId,
  });

  const { data: camera } = useQuery<Camera | null>({
    queryKey: ['camera', detection?.camera_id],
    queryFn: async () => {
      const res = await fetch(`/api/surveillance/cameras`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch cameras');
      const cameras: Camera[] = await res.json();
      const found = cameras.find(c => c.id === detection?.camera_id);
      return found || null;
    },
    enabled: !!detection?.camera_id,
  });

  if (detectionLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading detection details...</p>
        </div>
      </div>
    );
  }

  if (!detection) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Detection not found</p>
            <Link href="/surveillance">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Surveillance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getThreatEmoji = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  const getObjectIcon = (className: string) => {
    switch (className.toLowerCase()) {
      case 'person': return '👤';
      case 'weapon': return '🔫';
      case 'car': return '🚗';
      case 'truck': return '🚚';
      case 'motorcycle': return '🏍️';
      default: return '📦';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/surveillance">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detection Details</h1>
            <p className="text-gray-600 text-sm">
              ID: {detection.id.slice(0, 8)}... • {new Date(detection.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge className={`${getThreatColor(detection.threat_level)} text-lg px-4 py-2`}>
          {getThreatEmoji(detection.threat_level)} {detection.threat_level.toUpperCase()}
        </Badge>
      </div>

      {/* Critical Alert */}
      {detection.threat_level === 'critical' && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">CRITICAL THREAT DETECTED</h3>
                <p className="text-red-800 mb-4">
                  Weapon identified in surveillance footage. This requires immediate ranger dispatch
                  and emergency response protocol activation.
                </p>
                <div className="flex gap-3">
                  <Button variant="destructive">🚨 Dispatch Rangers</Button>
                  <Button variant="outline" className="border-red-500 text-red-700">
                    📞 Call Control Room
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image and Detections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Image */}
          <Card>
            <CardHeader>
              <CardTitle>📸 Captured Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img
                  src={detection.image_url}
                  alt="Detection"
                  className="w-full rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Note: Bounding boxes visualization will be added in next update
              </p>
            </CardContent>
          </Card>

          {/* Detected Objects */}
          <Card>
            <CardHeader>
              <CardTitle>🎯 Detected Objects ({detection.detection_count})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detection.detected_objects.map((obj, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getObjectIcon(obj.class)}</span>
                      <div>
                        <p className="font-semibold capitalize">{obj.class}</p>
                        <p className="text-sm text-gray-600">
                          Confidence: {(obj.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {(obj.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <div className="space-y-6">
          {/* Camera Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {camera ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Camera Name</p>
                    <p className="font-semibold">{camera.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="font-semibold">{camera.location}</p>
                  </div>
                  {camera.zone && (
                    <div>
                      <p className="text-sm text-gray-600">Zone</p>
                      <Badge variant="outline">{camera.zone}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">GPS Coordinates</p>
                    <p className="text-sm font-mono">
                      {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">Loading camera info...</p>
              )}
            </CardContent>
          </Card>

          {/* Timestamp */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timestamp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-semibold">
                  {new Date(detection.timestamp).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Time</p>
                <p className="font-semibold">
                  {new Date(detection.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Threat Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Threat Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Threat Level</p>
                  <Badge className={getThreatColor(detection.threat_level)}>
                    {detection.threat_level.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Detected Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(detection.detected_objects.map(o => o.class))).map(cls => (
                      <Badge key={cls} variant="secondary">
                        {getObjectIcon(cls)} {cls}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    {detection.threat_level === 'critical' && '🚨 Weapon detected - Immediate action required'}
                    {detection.threat_level === 'high' && '⚠️ Person with vehicle - Possible poaching activity'}
                    {detection.threat_level === 'medium' && '⚡ Person detected - Unauthorized entry possible'}
                    {detection.threat_level === 'low' && '✅ Vehicle only - Monitor activity'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>⚡ Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                📍 View on Map
              </Button>
              <Button className="w-full justify-start" variant="outline">
                📊 View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                🔔 Create Alert
              </Button>
              <Button className="w-full justify-start" variant="outline">
                📥 Export Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
