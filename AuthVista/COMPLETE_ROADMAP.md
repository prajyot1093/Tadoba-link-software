# 🗺️ Complete Development Roadmap - Tadoba Wildlife Surveillance System

## 📊 Project Overview

**Vision**: Production-grade wildlife surveillance system with real-time YOLO detection, PostgreSQL+PostGIS geofencing, and immersive forest-themed UI.

**Current Status**: Phase 3 Complete (Backend API Routes + PostGIS Spatial Queries)

---

## ✅ Completed Work (Phases 1-3)

### Phase 1: Database & Infrastructure ✅
**Commits**: `832b32d`, `b77cb3e`
- PostgreSQL 15 + PostGIS 3.3 setup
- 9 SQLAlchemy models with spatial columns:
  - `User` (JWT auth)
  - `Geofence` (GEOMETRY POLYGON, zone_type enum)
  - `Camera` (lat/lon/heading, RTSP support)
  - `Detection` (GEOMETRY POINT, bbox JSON, auto-geofence assignment)
  - `Incident`, `Alert`, `Animal` (GPS collar tracking)
- Alembic migrations configured
- Docker Compose (postgres, redis, backend, inference, frontend)
- init.sql with PostGIS extension and spatial indexes

### Phase 2: FastAPI Backend Core ✅
**Commit**: `832b32d`
- JWT authentication (python-jose + passlib bcrypt)
- Socket.IO server for real-time events
- CORS middleware
- Health check endpoint
- Password hashing with bcrypt
- Token-based auth middleware

### Phase 3: API Routes with PostGIS Spatial Queries ✅
**Status**: JUST COMPLETED (not yet committed)

**Files Created**:
```
backend/routes/
├── __init__.py              ✅ Package initialization
├── geofences.py            ✅ 8 endpoints + spatial queries
├── cameras.py              ✅ 7 endpoints + heartbeat
└── detections.py           ✅ 6 endpoints + heatmap
backend/test_api.py         ✅ Comprehensive test suite
backend/API_ROUTES_COMPLETE.md ✅ Documentation
```

**Endpoints Implemented**:

#### Geofences API (8 endpoints):
- `POST /api/geofences/` - Create with GeoJSON → PostGIS geometry
- `GET /api/geofences/` - List with filters (zone_type, active, pagination)
- `GET /api/geofences/{id}` - Get single
- `PUT /api/geofences/{id}` - Update (creator/admin only)
- `DELETE /api/geofences/{id}` - Soft delete
- `POST /api/geofences/check` - Point-in-polygon containment (ST_Contains)
- `POST /api/geofences/check-distance` - Proximity search (ST_DWithin)
- `GET /api/geofences/stats/summary` - Aggregations

**Spatial Query Patterns**:
```python
# Containment check
point = WKTElement(f'POINT({lon} {lat})', srid=4326)
geofence = db.query(Geofence).filter(
    ST_Contains(Geofence.geometry, point)
).first()

# Distance query (meters)
ST_DWithin(
    ST_Transform(Geofence.geometry, 3857),
    ST_Transform(point, 3857),
    max_distance_meters
)
```

#### Cameras API (7 endpoints):
- `POST /api/cameras/` - Register (laptop/rtsp/ip/dashcam)
- `GET /api/cameras/` - List with filters
- `GET /api/cameras/{id}` - Get single
- `PUT /api/cameras/{id}` - Update
- `DELETE /api/cameras/{id}` - Soft delete
- `POST /api/cameras/{id}/heartbeat` - Update last_seen (keep-alive)
- `GET /api/cameras/stats/summary` - Count by status/type

#### Detections API (6 endpoints):
- `POST /api/detections/` - Create with **auto-geofence assignment**
- `GET /api/detections/` - List (filter: camera, class, confidence, geofence, time)
- `GET /api/detections/{id}` - Get single
- `GET /api/detections/stats/summary` - Aggregations
- `GET /api/detections/heatmap/data` - [[lat, lon, intensity]] for viz

**Auto-Assignment Logic**:
```python
# Use camera location or provided detection location
lat = detection.latitude or camera.latitude
lon = detection.longitude or camera.longitude

# Create PostGIS point
db_detection.location = WKTElement(f'POINT({lon} {lat})', srid=4326)

# Find containing geofence
geofence = db.query(Geofence).filter(
    ST_Contains(Geofence.geometry, point),
    Geofence.is_active == True
).first()

if geofence:
    db_detection.geofence_id = geofence.id  # Auto-assign!
```

### Phase 10: Docker & Deployment ✅
**File**: `docker-compose.yml`
- Multi-service orchestration
- Health checks (pg_isready, redis ping)
- Volume mounts (postgres_data, redis_data, snapshots, models)
- Network: tadoba_network bridge

---

## 🚀 Next Phases Roadmap

### **Phase 4: YOLO Inference Worker** ⏳
**Priority**: HIGH  
**Time Estimate**: 4-5 hours  
**Git Strategy**: Feature branch + PR

#### Objectives:
- Download YOLOv8 pretrained model
- Build Python inference worker
- Integrate with FastAPI backend
- Enable webcam and RTSP stream processing

#### Implementation Plan:

**Step 1: Download YOLO Model** (30 min)
```bash
# Create models directory
mkdir -p backend/models

# Download YOLOv8 Nano (smallest, fastest)
curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt \
  -o backend/models/yolov8n.pt

# Verify download
ls -lh backend/models/yolov8n.pt
```

**Step 2: Create Inference Worker** (2 hours)

Create `backend/inference/worker.py`:
```python
import asyncio
import base64
import numpy as np
import cv2
from ultralytics import YOLO
from socketio import AsyncClient
import requests
import os

class YOLOWorker:
    def __init__(self):
        self.model = YOLO('models/yolov8n.pt')
        self.sio = AsyncClient()
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.token = None
        
    async def connect(self):
        """Connect to FastAPI backend via Socket.IO"""
        await self.sio.connect(self.backend_url)
        await self.authenticate()
        
    async def authenticate(self):
        """Get JWT token for API calls"""
        response = requests.post(
            f'{self.backend_url}/api/auth/login',
            data={
                'username': os.getenv('WORKER_USERNAME'),
                'password': os.getenv('WORKER_PASSWORD')
            }
        )
        self.token = response.json()['access_token']
        
    @self.sio.on('frame:ingest')
    async def process_frame(self, data):
        """Process incoming frame from webcam/RTSP"""
        # Decode base64 image
        img_bytes = base64.b64decode(data['frame'])
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Run YOLO inference
        results = self.model.predict(frame, conf=0.5)
        
        # Parse detections
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Extract bbox and class
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = self.model.names[cls]
                
                # Save snapshot
                snapshot_path = self.save_snapshot(frame, box)
                
                # POST detection to backend
                detection_data = {
                    'camera_id': data['camera_id'],
                    'detection_class': class_name,
                    'confidence': conf,
                    'bbox': {
                        'x': int(x1),
                        'y': int(y1),
                        'width': int(x2 - x1),
                        'height': int(y2 - y1)
                    },
                    'snapshot_url': snapshot_path,
                    'frame_id': data['frame_id']
                }
                
                # Call POST /api/detections
                response = requests.post(
                    f'{self.backend_url}/api/detections/',
                    json=detection_data,
                    headers={'Authorization': f'Bearer {self.token}'}
                )
                
                # Broadcast via Socket.IO
                await self.sio.emit('detection:created', response.json())
                
    def save_snapshot(self, frame, box):
        """Save detection snapshot to disk"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'detection_{timestamp}.jpg'
        path = f'snapshots/{filename}'
        
        # Crop to bbox
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        cropped = frame[y1:y2, x1:x2]
        
        cv2.imwrite(path, cropped)
        return path
        
    async def run(self):
        """Main worker loop"""
        await self.connect()
        print("✅ YOLO worker connected and ready")
        await self.sio.wait()

if __name__ == '__main__':
    worker = YOLOWorker()
    asyncio.run(worker.run())
```

Create `backend/inference/requirements.txt`:
```
ultralytics==8.1.11
opencv-python==4.9.0.80
torch==2.1.2
python-socketio[asyncio]==5.11.0
aiohttp==3.9.1
numpy==1.24.3
```

Create `backend/inference/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy worker code
COPY worker.py .

# Download YOLO model at build time
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

CMD ["python", "worker.py"]
```

**Step 3: Update docker-compose.yml** (15 min)
```yaml
  inference:
    build: ./backend/inference
    container_name: tadoba_inference
    environment:
      - BACKEND_URL=http://backend:8000
      - WORKER_USERNAME=yolo_worker
      - WORKER_PASSWORD=${YOLO_WORKER_PASSWORD}
    volumes:
      - ./snapshots:/app/snapshots
      - ./backend/models:/app/models
    depends_on:
      - backend
      - redis
    networks:
      - tadoba_network
    restart: unless-stopped
```

**Step 4: Test Inference** (1 hour)
```bash
# Start all services
docker-compose up -d

# Check inference worker logs
docker logs -f tadoba_inference

# Test with static image
python test_inference.py
```

Create `test_inference.py`:
```python
import requests
import base64
import socketio

# Connect to backend
sio = socketio.Client()
sio.connect('http://localhost:8000')

# Load test image
with open('test_images/person.jpg', 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode()

# Emit frame for processing
sio.emit('frame:ingest', {
    'camera_id': 1,
    'frame': img_base64,
    'frame_id': 'test_001'
})

# Listen for detection
@sio.on('detection:created')
def on_detection(data):
    print("✅ Detection received:", data)

sio.wait()
```

**Commits**:
1. `feat(inference): Add YOLOv8 model download script`
2. `feat(inference): Implement YOLO inference worker with Socket.IO`
3. `feat(inference): Add Dockerfile and requirements for inference service`
4. `feat(inference): Integrate inference worker with backend API`
5. `test(inference): Add inference test script with sample images`

---

### **Phase 5: Surveillance Page with Webcam** ⏳
**Priority**: HIGH  
**Time Estimate**: 3-4 hours  
**Dependencies**: Phase 4 complete

#### Objectives:
- Browser webcam capture
- Frame streaming via WebSocket
- Real-time detection overlay
- Detection list with bbox visualization

#### Implementation Plan:

**Step 1: Create Surveillance Component** (2 hours)

Create `client/src/pages/surveillance-real.tsx`:
```typescript
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Detection {
  id: number;
  detection_class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
  detected_at: string;
}

export default function SurveillanceReal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    // Connect to Socket.IO
    socketRef.current = io('http://localhost:8000');
    
    // Listen for detections
    socketRef.current.on('detection:created', (data: Detection) => {
      setDetections(prev => [data, ...prev].slice(0, 10));
      drawBoundingBox(data.bbox);
    });
    
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);
  
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        
        // Start frame capture at 5 FPS
        const interval = setInterval(() => captureFrame(), 200);
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Webcam error:', error);
      alert('Failed to access webcam. Please grant permission.');
    }
  };
  
  const stopWebcam = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsStreaming(false);
  };
  
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = frameData.split(',')[1];
    
    // Send to inference worker
    socketRef.current?.emit('frame:ingest', {
      camera_id: 1, // Laptop camera
      frame: base64,
      frame_id: `frame_${Date.now()}`
    });
    
    setFps(prev => prev + 1);
  };
  
  const drawBoundingBox = (bbox: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw red rectangle
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
  };
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">🎥 Live Surveillance</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              </div>
              
              <div className="mt-4 flex gap-4">
                <Button
                  onClick={startWebcam}
                  disabled={isStreaming}
                  className="bg-primary"
                >
                  Start Camera
                </Button>
                <Button
                  onClick={stopWebcam}
                  disabled={!isStreaming}
                  variant="destructive"
                >
                  Stop Camera
                </Button>
                
                <div className="ml-auto text-sm text-muted-foreground">
                  FPS: {fps}
                </div>
              </div>
            </Card>
          </div>
          
          {/* Detection List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-bold mb-4">Recent Detections</h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {detections.map(detection => (
                  <div
                    key={detection.id}
                    className="p-3 bg-muted rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold capitalize">
                          {detection.detection_class}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Confidence: {(detection.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(detection.detected_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {detections.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No detections yet. Start the camera to begin monitoring.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Update App Routes** (15 min)
```typescript
// client/src/App.tsx
import SurveillanceReal from './pages/surveillance-real';

// Add route
<Route path="/surveillance-real" element={<SurveillanceReal />} />
```

**Step 3: Test Webcam Integration** (1 hour)
- Browser permissions
- Frame capture rate
- Detection latency
- Bbox drawing accuracy

**Commits**:
1. `feat(frontend): Add real-time webcam surveillance page`
2. `feat(frontend): Implement WebSocket detection streaming`
3. `feat(frontend): Add bbox overlay drawing on video canvas`
4. `fix(frontend): Optimize frame capture rate to 5 FPS`

---

### **Phase 6: RTSP Dashcam Integration** ⏳
**Priority**: MEDIUM  
**Time Estimate**: 3-4 hours  
**Dependencies**: Phase 4, 5 complete

#### Objectives:
- RTSP stream ingestion
- FFmpeg frame extraction
- Multi-stream support
- Encrypted credential storage

#### Implementation Plan:

**Step 1: Install FFmpeg in Inference Container**
```dockerfile
# backend/inference/Dockerfile
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0
```

**Step 2: Create RTSP Ingestion Worker**

Create `backend/inference/rtsp_worker.py`:
```python
import cv2
import asyncio
import base64
import requests
from cryptography.fernet import Fernet
import os

class RTSPWorker:
    def __init__(self, camera_id, rtsp_url, key):
        self.camera_id = camera_id
        self.rtsp_url = self.decrypt_url(rtsp_url, key)
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.token = None
        
    def decrypt_url(self, encrypted_url, key):
        """Decrypt RTSP credentials"""
        f = Fernet(key)
        return f.decrypt(encrypted_url.encode()).decode()
        
    async def start_stream(self):
        """Start RTSP stream capture"""
        cap = cv2.VideoCapture(self.rtsp_url)
        
        if not cap.isOpened():
            print(f"❌ Failed to open RTSP stream: {self.camera_id}")
            return
            
        print(f"✅ RTSP stream opened: {self.camera_id}")
        
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                print(f"⚠️ Stream ended: {self.camera_id}")
                break
                
            # Process every 5th frame (5 FPS from 25 FPS stream)
            if frame_count % 5 == 0:
                await self.process_frame(frame)
                
            frame_count += 1
            await asyncio.sleep(0.04)  # 25 FPS
            
        cap.release()
        
    async def process_frame(self, frame):
        """Send frame to YOLO worker"""
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode()
        
        # Emit to Socket.IO
        # (handled by main YOLO worker)
        pass

# Start multiple RTSP workers
async def main():
    # Fetch cameras from backend
    cameras = requests.get(f'{backend_url}/api/cameras/?type=rtsp').json()
    
    # Start worker for each RTSP camera
    workers = [
        RTSPWorker(cam['id'], cam['url'], os.getenv('FERNET_KEY'))
        for cam in cameras
    ]
    
    await asyncio.gather(*[w.start_stream() for w in workers])

if __name__ == '__main__':
    asyncio.run(main())
```

**Step 3: Add Credential Encryption**

Create `backend/utils/crypto.py`:
```python
from cryptography.fernet import Fernet
import os

def get_fernet_key():
    """Get or generate Fernet key"""
    key = os.getenv('FERNET_KEY')
    if not key:
        key = Fernet.generate_key().decode()
        print(f"Generated FERNET_KEY: {key}")
        print("Add this to .env file!")
    return key.encode() if isinstance(key, str) else key

def encrypt_rtsp_url(url: str) -> str:
    """Encrypt RTSP URL with credentials"""
    f = Fernet(get_fernet_key())
    return f.encrypt(url.encode()).decode()

def decrypt_rtsp_url(encrypted_url: str) -> str:
    """Decrypt RTSP URL"""
    f = Fernet(get_fernet_key())
    return f.decrypt(encrypted_url.encode()).decode()
```

**Step 4: Update Camera Model**

Modify `backend/routes/cameras.py`:
```python
from utils.crypto import encrypt_rtsp_url

@router.post("/")
def create_camera(camera: CameraCreate, ...):
    # Encrypt RTSP URL if provided
    if camera.url and camera.type == 'rtsp':
        camera.url = encrypt_rtsp_url(camera.url)
    
    # Save to DB
    ...
```

**Commits**:
1. `feat(inference): Add FFmpeg to Dockerfile for RTSP support`
2. `feat(inference): Implement RTSP stream ingestion worker`
3. `feat(security): Add Fernet encryption for RTSP credentials`
4. `feat(cameras): Encrypt RTSP URLs before storing in database`
5. `test(rtsp): Add RTSP stream test with public camera feeds`

---

### **Phase 7: Geofencing Logic & Alerts** ⏳
**Priority**: HIGH  
**Time Estimate**: 2-3 hours  
**Dependencies**: Phase 3, 4 complete

#### Objectives:
- Server-side breach detection
- Priority-based alerting
- Real-time Socket.IO broadcasts
- Incident creation for core zone breaches

#### Implementation Plan:

**Step 1: Create Alert Service**

Create `backend/services/alert_service.py`:
```python
from sqlalchemy.orm import Session
from models import Detection, Geofence, Incident, Alert
from socketio import AsyncServer

async def check_geofence_breach(detection: Detection, db: Session, sio: AsyncServer):
    """Check if detection breaches geofence rules"""
    
    if not detection.geofence_id:
        return  # No geofence assigned
    
    geofence = db.query(Geofence).filter(Geofence.id == detection.geofence_id).first()
    
    if not geofence:
        return
    
    # Determine alert priority based on zone type
    priority_map = {
        'core': 'critical',
        'buffer': 'medium',
        'safe': 'low'
    }
    
    priority = priority_map.get(geofence.zone_type, 'low')
    
    # Create alert for person/car/weapon detections in core/buffer zones
    if detection.detection_class in ['person', 'car', 'weapon'] and geofence.zone_type in ['core', 'buffer']:
        alert = Alert(
            detection_id=detection.id,
            camera_id=detection.camera_id,
            geofence_id=geofence.id,
            alert_type='breach',
            priority=priority,
            message=f"{detection.detection_class.capitalize()} detected in {geofence.zone_type} zone: {geofence.name}",
            metadata={
                'confidence': detection.confidence,
                'bbox': detection.bbox,
                'zone_type': geofence.zone_type
            }
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)
        
        # Broadcast via Socket.IO
        await sio.emit('alert:created', {
            'id': alert.id,
            'detection_id': detection.id,
            'geofence_name': geofence.name,
            'zone_type': geofence.zone_type,
            'priority': priority,
            'message': alert.message,
            'timestamp': alert.created_at.isoformat()
        })
        
        # Create incident for critical alerts (core zone)
        if geofence.zone_type == 'core':
            incident = Incident(
                alert_id=alert.id,
                geofence_id=geofence.id,
                incident_type='intrusion',
                priority='critical',
                status='open',
                description=f"Unauthorized {detection.detection_class} detected in core zone: {geofence.name}",
                metadata={
                    'detection_id': detection.id,
                    'camera_id': detection.camera_id,
                    'snapshot_url': detection.snapshot_url
                }
            )
            db.add(incident)
            db.commit()
            
            # Broadcast incident
            await sio.emit('incident:created', {
                'id': incident.id,
                'alert_id': alert.id,
                'priority': 'critical',
                'description': incident.description
            })
```

**Step 2: Integrate Alert Service**

Modify `backend/routes/detections.py`:
```python
from services.alert_service import check_geofence_breach

@router.post("/")
async def create_detection(...):
    # ... existing code ...
    
    # Auto-assign geofence
    if lat and lon:
        geofence = find_containing_geofence(lat, lon, db)
        if geofence:
            db_detection.geofence_id = geofence.id
    
    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)
    
    # Check for breach and create alert
    await check_geofence_breach(db_detection, db, sio)
    
    return db_detection
```

**Step 3: Frontend Alert Toast**

Create `client/src/components/alert-toast.tsx`:
```typescript
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Shield, Info } from 'lucide-react';

export function useAlertToasts() {
  useEffect(() => {
    const socket = io('http://localhost:8000');
    
    socket.on('alert:created', (data) => {
      const icons = {
        critical: AlertTriangle,
        medium: Shield,
        low: Info
      };
      
      const Icon = icons[data.priority] || Info;
      
      toast({
        title: `${data.priority.toUpperCase()} Alert`,
        description: data.message,
        variant: data.priority === 'critical' ? 'destructive' : 'default',
        icon: <Icon className="w-5 h-5" />
      });
      
      // Play sound for critical alerts
      if (data.priority === 'critical') {
        const audio = new Audio('/sounds/alert.mp3');
        audio.play();
      }
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('Tadoba Alert', {
          body: data.message,
          icon: '/logo.png',
          tag: `alert-${data.id}`
        });
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
}
```

**Commits**:
1. `feat(alerts): Add alert service with breach detection logic`
2. `feat(alerts): Integrate alert creation with detection flow`
3. `feat(incidents): Auto-create incidents for core zone breaches`
4. `feat(frontend): Add real-time alert toast notifications`
5. `feat(frontend): Add sound and browser notifications for critical alerts`

---

### **Phase 8: Analytics Dashboard** ⏳
**Priority**: MEDIUM  
**Time Estimate**: 3-4 hours  
**Dependencies**: Phase 3, 7 complete

#### Objectives:
- Detection timeline with playback
- Heatmap visualization
- Trend charts
- Export to CSV/PDF

#### Implementation Plan:

**Step 1: Analytics API Endpoints**

Add to `backend/routes/detections.py`:
```python
@router.get("/timeline")
def get_detection_timeline(
    start_date: str,
    end_date: str,
    detection_class: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detection timeline for playback"""
    query = db.query(Detection).filter(
        Detection.detected_at.between(start_date, end_date)
    )
    
    if detection_class:
        query = query.filter(Detection.detection_class == detection_class)
    
    detections = query.order_by(Detection.detected_at).all()
    
    return [{
        'id': d.id,
        'detection_class': d.detection_class,
        'confidence': d.confidence,
        'latitude': d.latitude,
        'longitude': d.longitude,
        'detected_at': d.detected_at.isoformat(),
        'snapshot_url': d.snapshot_url
    } for d in detections]

@router.get("/trends")
def get_detection_trends(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detection trends for charts"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Detections per day
    daily_counts = db.query(
        func.date(Detection.detected_at).label('date'),
        func.count(Detection.id).label('count')
    ).filter(
        Detection.detected_at >= start_date
    ).group_by(func.date(Detection.detected_at)).all()
    
    # Detections by class
    class_counts = db.query(
        Detection.detection_class,
        func.count(Detection.id).label('count')
    ).filter(
        Detection.detected_at >= start_date
    ).group_by(Detection.detection_class).all()
    
    return {
        'daily': [{'date': str(d.date), 'count': d.count} for d in daily_counts],
        'by_class': [{'class': c.detection_class, 'count': c.count} for c in class_counts]
    }
```

**Step 2: Frontend Analytics Page**

Create `client/src/pages/analytics-dashboard.tsx`:
```typescript
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: async () => {
      const response = await fetch('/api/detections/trends?days=30');
      return response.json();
    }
  });
  
  const { data: heatmapData } = useQuery({
    queryKey: ['heatmap'],
    queryFn: async () => {
      const response = await fetch('/api/detections/heatmap/data');
      return response.json();
    }
  });
  
  const exportToCSV = async () => {
    const response = await fetch('/api/detections/?format=csv');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detections_${new Date().toISOString()}.csv`;
    a.click();
  };
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">📊 Analytics</h1>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Detections Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Detections Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends?.daily || []}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          
          {/* Detection by Class Chart */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Detections by Class</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends?.by_class || []}>
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add Heatmap Layer to Map**

Modify `client/src/pages/map.tsx`:
```typescript
import L from 'leaflet';
import 'leaflet.heat';

// Add heatmap layer
const heatmapData = data.points.map(([lat, lon, intensity]) => [lat, lon, intensity / 10]);

const heatLayer = L.heatLayer(heatmapData, {
  radius: 25,
  blur: 35,
  maxZoom: 17,
  gradient: {
    0.0: 'blue',
    0.5: 'lime',
    0.7: 'yellow',
    1.0: 'red'
  }
});

heatLayer.addTo(map);
```

**Commits**:
1. `feat(analytics): Add timeline and trends API endpoints`
2. `feat(frontend): Create analytics dashboard with charts`
3. `feat(analytics): Add CSV export functionality`
4. `feat(map): Integrate detection heatmap layer`

---

### **Phase 9: Enhanced Forest Theme UI** ⏳
**Priority**: LOW  
**Time Estimate**: 2-3 hours  
**Dependencies**: All features complete

#### Objectives:
- Jungle background video
- Animated dew-drop particles
- Glassmorphism polish
- Floating navbar
- Toast notifications with leaf icons

#### Implementation Plan:

**Step 1: Add Background Video**
```typescript
// client/src/components/ui/forest-background.tsx
export function ForestBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover blur-sm opacity-20"
      >
        <source src="/videos/jungle-background.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/60" />
    </div>
  );
}
```

**Step 2: Animated Dew Drops**
```typescript
// client/src/components/ui/dew-drops.tsx
import { useEffect, useRef } from 'react';

export function DewDrops() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const drops: Array<{x: number, y: number, radius: number, speed: number}> = [];
    
    // Create drops
    for (let i = 0; i < 50; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2
      });
    }
    
    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      drops.forEach(drop => {
        // Draw dew drop
        const gradient = ctx.createRadialGradient(
          drop.x, drop.y, 0,
          drop.x, drop.y, drop.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Move drop
        drop.y += drop.speed;
        
        // Reset when off-screen
        if (drop.y > canvas.height) {
          drop.y = -drop.radius;
          drop.x = Math.random() * canvas.width;
        }
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-40"
    />
  );
}
```

**Step 3: Floating Navbar**
```css
/* client/src/index.css */
.floating-navbar {
  @apply fixed top-4 left-1/2 -translate-x-1/2 z-50;
  @apply bg-card/80 backdrop-blur-lg border border-primary/20;
  @apply rounded-full px-6 py-3 shadow-lg;
  @apply transition-all duration-300 hover:shadow-xl;
}
```

**Step 4: Leaf Icon Toasts**
```typescript
// client/src/components/ui/toast.tsx
import { Leaf } from 'lucide-react';

// Add custom variant
variants: {
  variant: {
    success: 'bg-green-50 border-green-200 text-green-900',
    // ... other variants
  }
}

// Use in alerts
toast({
  variant: 'success',
  title: 'Wildlife Detected',
  description: 'Tiger spotted in Core Zone Alpha',
  icon: <Leaf className="w-5 h-5 text-green-600" />
});
```

**Commits**:
1. `feat(ui): Add jungle background video with blur effect`
2. `feat(ui): Implement animated dew-drop particle system`
3. `feat(ui): Add floating navbar with glassmorphism`
4. `feat(ui): Custom toast notifications with leaf icons`
5. `style(ui): Polish glassmorphism effects across all pages`

---

## 🎯 Commit Strategy & Best Practices

### Git Workflow:
```bash
# Create feature branch for each phase
git checkout -b feat/phase-4-yolo-inference
git checkout -b feat/phase-5-surveillance-webcam
git checkout -b feat/phase-6-rtsp-integration
git checkout -b feat/phase-7-geofencing-alerts
git checkout -b feat/phase-8-analytics-dashboard
git checkout -b feat/phase-9-enhanced-ui

# Commit frequently with descriptive messages
git commit -m "feat(inference): Add YOLOv8 model download script"
git commit -m "feat(frontend): Implement WebSocket detection streaming"

# Push and create PR for review
git push origin feat/phase-4-yolo-inference

# Merge to master after testing
git checkout master
git merge feat/phase-4-yolo-inference
git push origin master
```

### Commit Message Format:
```
<type>(<scope>): <subject>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

Examples:
feat(inference): Add YOLO inference worker with Socket.IO
fix(cameras): Resolve RTSP stream timeout issue
docs(readme): Update installation instructions
test(api): Add integration tests for geofence endpoints
```

### Recommended Commit Frequency:
- **Small incremental changes**: Every 30-60 minutes
- **Feature milestones**: After each sub-step completes
- **Before risky changes**: Commit working state first
- **End of day**: Always commit progress

### Total Estimated Commits:
- Phase 4: 5 commits
- Phase 5: 4 commits
- Phase 6: 5 commits
- Phase 7: 5 commits
- Phase 8: 4 commits
- Phase 9: 5 commits
- **Total: 28 new commits** (on top of existing 18 commits = **46 total**)

---

## 📊 Testing Strategy

### Unit Tests:
```python
# backend/tests/test_geofences.py
def test_point_in_polygon():
    # Test ST_Contains logic
    point = (20.24, 79.34)
    geofence = create_test_geofence()
    assert is_point_in_geofence(point, geofence) == True

def test_proximity_query():
    # Test ST_DWithin logic
    geofences = find_geofences_within_distance(point, 1000)
    assert len(geofences) > 0
```

### Integration Tests:
```python
# backend/tests/test_api_integration.py
def test_detection_creates_alert():
    # Create detection in core zone
    response = client.post('/api/detections/', json={
        'camera_id': 1,
        'detection_class': 'person',
        'latitude': 20.24,
        'longitude': 79.34
    })
    
    # Verify alert created
    alerts = client.get('/api/alerts/').json()
    assert any(a['priority'] == 'critical' for a in alerts)
```

### End-to-End Tests:
```typescript
// client/tests/e2e/surveillance.spec.ts
test('webcam detections create alerts', async ({ page }) => {
  await page.goto('/surveillance-real');
  await page.click('text=Start Camera');
  
  // Wait for detection
  await page.waitForSelector('text=Person', { timeout: 10000 });
  
  // Verify toast notification
  await expect(page.locator('.toast')).toContainText('CRITICAL Alert');
});
```

---

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] All tests passing
- [ ] Docker images built
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] YOLO model downloaded
- [ ] RTSP credentials encrypted

### Production Setup:
```bash
# 1. Build Docker images
docker build -t tadoba-backend:latest ./backend
docker build -t tadoba-frontend:latest ./client
docker build -t tadoba-inference:latest ./backend/inference

# 2. Push to registry
docker push your-registry/tadoba-backend:latest
docker push your-registry/tadoba-frontend:latest
docker push your-registry/tadoba-inference:latest

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify services
docker ps
docker logs tadoba_backend
docker logs tadoba_inference
```

### Monitoring:
- [ ] Setup Prometheus metrics
- [ ] Configure Grafana dashboards
- [ ] Enable error tracking (Sentry)
- [ ] Setup log aggregation (ELK/Loki)

---

## 📝 Documentation Updates Needed

### README.md:
- Installation instructions for each phase
- Environment variables reference
- API endpoints documentation
- Testing instructions
- Deployment guide

### API Documentation:
- OpenAPI/Swagger auto-generated at `/docs`
- ReDoc alternative at `/redoc`
- Example requests/responses
- Authentication flow

### Developer Guide:
- Architecture overview
- Database schema diagrams
- PostGIS spatial query examples
- YOLO model integration guide
- WebSocket event reference

---

## ⏱️ Time Estimates Summary

| Phase | Time | Commits | Priority |
|-------|------|---------|----------|
| Phase 4: YOLO Inference | 4-5 hours | 5 | HIGH |
| Phase 5: Surveillance Webcam | 3-4 hours | 4 | HIGH |
| Phase 6: RTSP Integration | 3-4 hours | 5 | MEDIUM |
| Phase 7: Geofencing Alerts | 2-3 hours | 5 | HIGH |
| Phase 8: Analytics Dashboard | 3-4 hours | 4 | MEDIUM |
| Phase 9: Enhanced UI | 2-3 hours | 5 | LOW |
| **Total** | **17-23 hours** | **28** | - |

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product):
- ✅ Phase 1-3 complete (Database, Backend, API Routes)
- [ ] Phase 4 complete (YOLO inference working)
- [ ] Phase 5 complete (Webcam surveillance working)
- [ ] Phase 7 complete (Alerts working)
- **Result**: Functional wildlife surveillance system

### Full Production:
- [ ] All phases complete
- [ ] All tests passing (>80% coverage)
- [ ] Docker deployment working
- [ ] Documentation complete
- **Result**: Enterprise-ready system

---

## 📚 Resources

### PostGIS Documentation:
- [ST_Contains](https://postgis.net/docs/ST_Contains.html)
- [ST_DWithin](https://postgis.net/docs/ST_DWithin.html)
- [Spatial Indexes](https://postgis.net/workshops/postgis-intro/indexing.html)

### YOLO Resources:
- [Ultralytics YOLOv8 Docs](https://docs.ultralytics.com/)
- [Model Zoo](https://github.com/ultralytics/assets/releases)
- [Training Guide](https://docs.ultralytics.com/modes/train/)

### WebSocket/Socket.IO:
- [Socket.IO Server API](https://socket.io/docs/v4/server-api/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)

---

## 🔄 Next Immediate Action

**Start Phase 4: YOLO Inference Worker**

```bash
# 1. Create feature branch
git checkout -b feat/phase-4-yolo-inference

# 2. Download YOLO model
mkdir -p backend/models
curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt \
  -o backend/models/yolov8n.pt

# 3. Create inference directory
mkdir -p backend/inference
touch backend/inference/worker.py
touch backend/inference/requirements.txt
touch backend/inference/Dockerfile

# 4. Start implementation
code backend/inference/worker.py
```

---

**Last Updated**: October 14, 2025  
**Next Review**: After Phase 4 completion  
**Contact**: Project maintainer

---

*This roadmap is a living document. Update after each phase completion!*
