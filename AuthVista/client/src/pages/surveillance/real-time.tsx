import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Video, 
  VideoOff, 
  AlertTriangle, 
  Activity,
  Settings,
  Download,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';

interface Detection {
  id?: number;
  camera_id: number;
  detection_class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  timestamp: string;
  snapshot_path?: string;
}

interface ProcessedFrame {
  camera_id: number;
  timestamp: string;
  detections_count: number;
  processing_time_ms: number;
  detections: Detection[];
}

export default function SurveillanceRealTime() {
  const { toast } = useToast();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('1');
  const [selectedGeofence, setSelectedGeofence] = useState('1');
  const [frameRate, setFrameRate] = useState(5); // FPS
  const [showBboxes, setShowBboxes] = useState(true);
  const [showDetectionList, setShowDetectionList] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState({
    framesProcessed: 0,
    totalDetections: 0,
    avgProcessingTime: 0,
    lastDetection: null as Detection | null
  });
  
  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io('http://localhost:8000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to backend');
      toast({
        title: 'Connected',
        description: 'Socket.IO connection established',
      });
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚠️ Disconnected from backend');
      toast({
        title: 'Disconnected',
        description: 'Connection lost. Attempting to reconnect...',
        variant: 'destructive'
      });
    });
    
    socket.on('detection:created', (detection: Detection) => {
      console.log('🎯 Detection received:', detection);
      
      setDetections(prev => [detection, ...prev].slice(0, 50)); // Keep last 50
      setStats(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + 1,
        lastDetection: detection
      }));
      
      // Show toast for high-confidence detections
      if (detection.confidence > 0.7) {
        toast({
          title: `${detection.detection_class} detected!`,
          description: `Confidence: ${(detection.confidence * 100).toFixed(1)}%`,
        });
      }
    });
    
    socket.on('frame:processed', (data: ProcessedFrame) => {
      setStats(prev => ({
        ...prev,
        framesProcessed: prev.framesProcessed + 1,
        avgProcessingTime: data.processing_time_ms
      }));
      
      // Draw bounding boxes for detections in this frame
      if (data.detections && data.detections.length > 0 && showBboxes) {
        drawBoundingBoxes(data.detections);
      }
    });
    
    socket.on('error', (error: any) => {
      console.error('❌ Socket error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Socket.IO error occurred',
        variant: 'destructive'
      });
    });
    
    return () => {
      socket.disconnect();
    };
  }, [toast, showBboxes]);
  
  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      
      toast({
        title: 'Webcam Started',
        description: 'Camera access granted',
      });
      
      return true;
    } catch (error) {
      console.error('❌ Webcam error:', error);
      toast({
        title: 'Webcam Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);
  
  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);
  
  // Capture and send frame
  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current?.connected) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64 JPEG
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    const base64Frame = frameData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
    
    // Send frame to backend
    socketRef.current.emit('frame:ingest', {
      frame: base64Frame,
      camera_id: parseInt(selectedCamera),
      geofence_id: parseInt(selectedGeofence),
      timestamp: new Date().toISOString()
    });
  }, [selectedCamera, selectedGeofence]);
  
  // Draw bounding boxes on canvas overlay
  const drawBoundingBoxes = useCallback((detections: Detection[]) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each detection
    detections.forEach(detection => {
      const { bbox, detection_class, confidence } = detection;
      
      // Get canvas scale factors
      const scaleX = canvas.width / (videoRef.current?.videoWidth || 1);
      const scaleY = canvas.height / (videoRef.current?.videoHeight || 1);
      
      // Scale bounding box coordinates
      const x1 = bbox.x1 * scaleX;
      const y1 = bbox.y1 * scaleY;
      const x2 = bbox.x2 * scaleX;
      const y2 = bbox.y2 * scaleY;
      const width = x2 - x1;
      const height = y2 - y1;
      
      // Choose color based on class
      let color = '#00FF00'; // Green for wildlife
      if (detection_class === 'person') {
        color = '#FF0000'; // Red for human intrusion
      } else if (['car', 'truck', 'motorcycle'].includes(detection_class)) {
        color = '#FFA500'; // Orange for vehicles
      }
      
      // Draw rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);
      
      // Draw label background
      const label = `${detection_class} ${(confidence * 100).toFixed(0)}%`;
      ctx.font = '16px Arial';
      const textMetrics = ctx.measureText(label);
      const textHeight = 20;
      
      ctx.fillStyle = color;
      ctx.fillRect(x1, y1 - textHeight - 5, textMetrics.width + 10, textHeight + 5);
      
      // Draw label text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x1 + 5, y1 - 8);
    });
  }, []);
  
  // Start/stop streaming
  const toggleStreaming = useCallback(async () => {
    if (isStreaming) {
      // Stop streaming
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      stopWebcam();
      setIsStreaming(false);
      
      toast({
        title: 'Streaming Stopped',
        description: 'Frame capture paused',
      });
    } else {
      // Start streaming
      const webcamStarted = await startWebcam();
      if (!webcamStarted) return;
      
      setIsStreaming(true);
      
      // Start frame capture interval
      frameIntervalRef.current = setInterval(() => {
        captureAndSendFrame();
      }, 1000 / frameRate);
      
      toast({
        title: 'Streaming Started',
        description: `Capturing at ${frameRate} FPS`,
      });
    }
  }, [isStreaming, startWebcam, stopWebcam, captureAndSendFrame, frameRate, toast]);
  
  // Update frame rate
  useEffect(() => {
    if (isStreaming && frameIntervalRef.current) {
      // Restart interval with new frame rate
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = setInterval(() => {
        captureAndSendFrame();
      }, 1000 / frameRate);
    }
  }, [frameRate, isStreaming, captureAndSendFrame]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      stopWebcam();
    };
  }, [stopWebcam]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-8 h-8 text-green-600" />
              Real-Time Surveillance
            </h1>
            <p className="text-gray-600 mt-1">
              Live webcam detection with YOLOv8
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              <Activity className="w-3 h-3" />
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            
            <Button
              onClick={toggleStreaming}
              size="lg"
              variant={isStreaming ? 'destructive' : 'default'}
              className="gap-2"
            >
              {isStreaming ? (
                <>
                  <VideoOff className="w-5 h-5" />
                  Stop Streaming
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Start Streaming
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`lg:col-span-2 ${isFullscreen ? 'fixed inset-0 z-50 p-6 bg-black' : ''}`}
        >
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Feed</CardTitle>
                <CardDescription>
                  {isStreaming ? `Streaming at ${frameRate} FPS` : 'Click Start to begin'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBboxes(!showBboxes)}
                  title={showBboxes ? 'Hide bboxes' : 'Show bboxes'}
                >
                  {showBboxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* Video element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                
                {/* Canvas overlay for bounding boxes */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ display: showBboxes ? 'block' : 'none' }}
                />
                
                {/* Overlay indicators */}
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center text-white">
                      <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Click "Start Streaming" to begin</p>
                    </div>
                  </div>
                )}
                
                {isStreaming && (
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge variant="destructive" className="gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </Badge>
                    
                    {stats.lastDetection && (
                      <Badge className="gap-1 bg-green-600">
                        <Zap className="w-3 h-3" />
                        {stats.lastDetection.detection_class} ({(stats.lastDetection.confidence * 100).toFixed(0)}%)
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Stats overlay */}
                {isStreaming && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-xs space-y-1">
                    <div>Frames: {stats.framesProcessed}</div>
                    <div>Detections: {stats.totalDetections}</div>
                    <div>Latency: {stats.avgProcessingTime}ms</div>
                  </div>
                )}
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>
        
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Settings */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Settings
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label>Camera ID</Label>
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Camera 1 (Webcam)</SelectItem>
                    <SelectItem value="2">Camera 2</SelectItem>
                    <SelectItem value="3">Camera 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Geofence Zone</Label>
                <Select value={selectedGeofence} onValueChange={setSelectedGeofence}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Core Zone (Critical)</SelectItem>
                    <SelectItem value="2">Buffer Zone (Medium)</SelectItem>
                    <SelectItem value="3">Safe Zone (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Frame Rate: {frameRate} FPS</Label>
                <Slider
                  value={[frameRate]}
                  onValueChange={(value) => setFrameRate(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                  disabled={isStreaming}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Adjust before starting stream
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Show Detection List</Label>
                <Switch
                  checked={showDetectionList}
                  onCheckedChange={setShowDetectionList}
                />
              </div>
            </CardContent>
          </GlassCard>
          
          {/* Detections List */}
          {showDetectionList && (
            <GlassCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Recent Detections
                </CardTitle>
                <CardDescription>
                  Last 50 detections
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {detections.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No detections yet
                      </p>
                    )}
                    
                    {detections.map((detection, idx) => (
                      <motion.div
                        key={`${detection.timestamp}-${idx}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-3 bg-white/50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge 
                            variant={detection.detection_class === 'person' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {detection.detection_class}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(detection.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Confidence:</span>
                            <span className="font-medium">{(detection.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
