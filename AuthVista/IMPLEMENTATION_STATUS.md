# 🌲 Tadoba Wildlife Surveillance - Implementation Progress

## ✅ Phase 1-2 Complete: Backend Foundation

**Date**: October 14, 2025  
**Status**: Backend scaffolding complete, ready for API route implementation

---

## 📦 What's Been Created

### 1. Database Schema (PostgreSQL + PostGIS)

**File**: `backend/models.py`

Created 9 production-ready database models with spatial support:

- **User**: Authentication with role-based access (admin/ranger/viewer/local)
- **Geofence**: Polygon zones with PostGIS `GEOMETRY('POLYGON')` column
  - Types: Core (high sensitivity), Buffer (early warning), Safe (tracking only)
  - Stores GeoJSON polygons with color, properties metadata
- **Camera**: Multi-source support (laptop/RTSP/IP/dashcam)
  - Geolocation (lat/lon/heading) for spatial queries
  - Status tracking (online/offline/maintenance/error)
- **Detection**: YOLO detection results
  - Class (person/car/weapon/wildlife), confidence, bounding box
  - PostGIS `POINT` geometry for spatial containment checks
  - Links to camera and geofence (auto-assigned on server)
- **Incident**: High-priority alerts with workflow
  - Priority levels, status tracking, assignment
- **Alert**: Real-time notifications
- **Animal**: Wildlife tracking with GPS collar integration

**Spatial Features**:
- PostGIS `GEOMETRY` columns with SRID 4326 (WGS84)
- Ready for `ST_Contains`, `ST_DWithin`, `ST_Distance` queries
- Automatic spatial indexing via GiST indexes

---

### 2. FastAPI Backend Core

**File**: `backend/main.py`

**Features Implemented**:
- ✅ JWT authentication with bcrypt password hashing
- ✅ OAuth2 password flow for token-based auth
- ✅ Socket.IO integration for real-time events
- ✅ CORS middleware with configurable origins
- ✅ Database session management with SQLAlchemy
- ✅ Health check endpoint

**Auth Routes**:
```python
POST /api/auth/register  # Create new user
POST /api/auth/login     # Get JWT token
GET  /api/auth/me        # Get current user info
```

**WebSocket Events**:
```python
# Server → Clients
socket.emit('detection:create', detection_data)
socket.emit('alert:create', alert_data)
socket.emit('camera:update', status_data)
```

---

### 3. Pydantic Schemas

**File**: `backend/schemas.py`

Type-safe request/response models for:
- User registration/login
- Geofence creation with GeoJSON validation
- Camera CRUD operations
- Detection events with bounding box schema
- WebSocket event schemas

---

### 4. Alembic Migrations

**Setup**:
- `backend/alembic.ini`: Configuration with env variable override
- `backend/alembic/env.py`: Auto-import all models for autogenerate
- `backend/alembic/versions/`: Ready for initial migration

**Usage**:
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

### 5. Docker Infrastructure

**File**: `docker-compose.yml`

**Services**:
1. **postgres**: PostGIS/PostGIS 15-3.3
   - Automatic PostGIS extension enablement via `init.sql`
   - Health checks with retry logic
   - Persistent volume for data

2. **redis**: For Celery task queue (inference jobs)
   - Alpine Linux (lightweight)
   - Health checks enabled

3. **backend**: FastAPI with hot-reload
   - Auto-runs Alembic migrations on startup
   - Mounts code for development
   - Shared volumes: snapshots, models

4. **inference**: YOLO worker (to be created)
   - CPU mode by default (configurable for GPU)
   - Resource limits: 2 CPUs, 4GB RAM

5. **frontend**: React production build
   - Nginx serving on port 80

**Networking**: All services on `tadoba_network` bridge

---

### 6. Configuration

**File**: `backend/.env.sample`

Environment variables for:
- Database credentials
- JWT secret key
- Mapbox token (for frontend map)
- AWS S3 (optional, for snapshot storage)
- RTSP encryption key
- YOLO model configuration
- Snapshot retention policy

---

### 7. Documentation

**File**: `README_PRODUCTION.md`

Comprehensive production documentation including:
- Architecture diagram
- Quick start with Docker
- Development setup without Docker
- Database schema explanation
- Spatial query examples
- Webcam/RTSP integration code samples
- Geofencing API usage
- YOLO fine-tuning guide
- Deployment to Kubernetes
- API documentation with curl examples

---

## 🚀 Next Steps (Priority Order)

### Immediate (Phase 3): Geofence API Routes

**File**: `backend/routes/geofences.py` (to create)

Implement CRUD endpoints with PostGIS spatial queries:

```python
# 1. Create geofence (store GeoJSON polygon)
POST /api/geofences
{
  "name": "Core Zone A",
  "zone_type": "core",
  "geometry": {"type": "Polygon", "coordinates": [[[lng, lat], ...]]},
  "color": "#ef4444"
}

# 2. List geofences with spatial filtering
GET /api/geofences?zone_type=core&active=true

# 3. Check point containment
POST /api/geofences/check
{
  "lat": 20.2347,
  "lon": 79.3401
}
# Returns: {geofence_id, zone_type, distance_to_nearest}

# 4. Update/Delete geofence
PUT /api/geofences/{id}
DELETE /api/geofences/{id}
```

**Key Implementation**:
```python
from geoalchemy2.functions import ST_Contains, ST_GeomFromGeoJSON
from geoalchemy2.elements import WKTElement

# Store GeoJSON as PostGIS geometry
geom = ST_GeomFromGeoJSON(str(geojson))
geofence.geometry = geom

# Check containment
point = WKTElement(f'POINT({lon} {lat})', srid=4326)
geofence = db.query(Geofence).filter(
    ST_Contains(Geofence.geometry, point)
).first()
```

---

### Phase 4: YOLO Inference Worker

**File**: `inference/worker.py` (to create)

**Architecture**:
1. WebSocket server listens for frames from frontend
2. Receives base64-encoded JPEG frames
3. Decodes → runs YOLOv8 inference
4. Extracts detections (class, confidence, bbox)
5. Saves snapshot to local storage or S3
6. Persists detection to PostgreSQL
7. Broadcasts detection event via Socket.IO

**Pseudocode**:
```python
from ultralytics import YOLO
import socketio
import cv2
import base64

# Load model
model = YOLO('models/yolov8n.pt')

# Socket.IO client connected to backend
sio = socketio.Client()

@sio.on('frame')
def process_frame(data):
    camera_id = data['camera_id']
    frame_b64 = data['frame']
    
    # Decode frame
    frame = decode_base64_image(frame_b64)
    
    # Run inference
    results = model.predict(frame, conf=0.5)
    
    # Process detections
    for detection in results[0].boxes:
        cls = model.names[int(detection.cls)]
        conf = float(detection.conf)
        bbox = detection.xyxy[0].tolist()  # [x1, y1, x2, y2]
        
        # Save snapshot
        snapshot_url = save_snapshot(frame, bbox)
        
        # Save to database
        detection_record = create_detection(
            camera_id=camera_id,
            class=cls,
            confidence=conf,
            bbox=bbox,
            snapshot_url=snapshot_url
        )
        
        # Check geofence breach
        if camera.latitude and camera.longitude:
            geofence = check_geofence_containment(
                camera.latitude, camera.longitude
            )
            if geofence and geofence.zone_type == 'core':
                create_alert(detection_record, priority='critical')
        
        # Broadcast to clients
        sio.emit('detection:create', detection_record.dict())
```

---

### Phase 5: Frontend Surveillance Page

**File**: `client/src/pages/surveillance-real.tsx` (new file)

**Features**:
1. **Camera Grid**: Show all cameras with live feeds
2. **Webcam Integration**: 
   ```javascript
   const stream = await navigator.mediaDevices.getUserMedia({
     video: { width: 1280, height: 720, facingMode: 'user' }
   });
   
   // Capture frames at 5 FPS
   setInterval(() => {
     const canvas = document.createElement('canvas');
     canvas.getContext('2d').drawImage(videoElement, 0, 0);
     const frame = canvas.toDataURL('image/jpeg', 0.8);
     socket.emit('frame', { camera_id: laptopCamId, frame });
   }, 200);
   ```

3. **Detection Overlay**: Draw bounding boxes on video
   ```javascript
   socket.on('detection:create', (detection) => {
     if (detection.camera_id === currentCameraId) {
       drawBoundingBox(canvas, detection.bbox, detection.class, detection.confidence);
     }
   });
   ```

4. **Real-time Stats**: Show FPS, detection count, last alert

---

### Phase 6: RTSP Integration

**File**: `inference/rtsp_worker.py` (to create)

Use `ffmpeg` to pull RTSP streams and send frames to YOLO:

```python
import subprocess
import numpy as np

def ingest_rtsp_stream(rtsp_url, camera_id):
    process = subprocess.Popen([
        'ffmpeg',
        '-rtsp_transport', 'tcp',
        '-i', rtsp_url,
        '-f', 'image2pipe',
        '-vf', 'fps=5',  # 5 frames per second
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-'
    ], stdout=subprocess.PIPE, bufsize=10**8)
    
    frame_size = width * height * 3
    while True:
        raw_frame = process.stdout.read(frame_size)
        if not raw_frame:
            break
        
        frame = np.frombuffer(raw_frame, dtype=np.uint8)
        frame = frame.reshape((height, width, 3))
        
        # Send to inference
        process_frame_with_yolo(frame, camera_id)
```

---

## 📊 Current Architecture

```
┌──────────────────────┐
│  React Frontend      │ ← User sees detections with bounding boxes
│  (Surveillance Page) │
└──────────┬───────────┘
           │ WebSocket (frame upload)
           ▼
┌──────────────────────┐
│  FastAPI Backend     │ ← JWT auth, geofence APIs, Socket.IO hub
│  (main.py)           │
└──────────┬───────────┘
           │ REST API / WebSocket
           ▼
┌──────────────────────┐
│  YOLO Inference      │ ← YOLOv8 detection, snapshot storage
│  Worker (to create)  │
└──────────┬───────────┘
           │ SQL queries
           ▼
┌──────────────────────┐
│  PostgreSQL+PostGIS  │ ← Spatial queries, detection history
│  (Docker container)  │
└──────────────────────┘
```

---

## 🧪 Testing the Backend (After Docker Startup)

### 1. Start Services

```bash
cd AuthVista
docker-compose up -d

# Wait for health checks to pass
docker-compose ps
```

### 2. Create Admin User

```bash
docker exec -it tadoba_backend python

from database import SessionLocal
from models import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

admin = User(
    email="admin@tadoba.com",
    username="admin",
    full_name="Admin User",
    hashed_password=pwd_context.hash("admin123"),
    role="admin"
)
db.add(admin)
db.commit()
```

### 3. Test Auth API

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Should return:
# {"access_token": "eyJ...", "token_type": "bearer"}

# Get current user
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 4. Test WebSocket

Open browser console at `http://localhost:5173`:

```javascript
const socket = io('http://localhost:8000');

socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO');
});

socket.on('detection:create', (data) => {
  console.log('🔍 New detection:', data);
});
```

---

## 📝 Files Created (Summary)

```
AuthVista/
├── backend/
│   ├── main.py              ✅ FastAPI app with auth & Socket.IO
│   ├── models.py            ✅ SQLAlchemy models with PostGIS
│   ├── schemas.py           ✅ Pydantic validation schemas
│   ├── database.py          ✅ DB connection & session management
│   ├── requirements.txt     ✅ Python dependencies
│   ├── .env.sample          ✅ Environment variables template
│   ├── Dockerfile           ✅ Backend container image
│   ├── alembic.ini          ✅ Alembic configuration
│   └── alembic/
│       ├── env.py           ✅ Migration environment
│       ├── script.py.mako   ✅ Migration template
│       └── versions/        ✅ (empty, ready for migrations)
├── docker-compose.yml       ✅ Multi-service orchestration
├── init.sql                 ✅ PostGIS extension setup
└── README_PRODUCTION.md     ✅ Complete documentation
```

---

## 🎯 Immediate Next Action

**Create Geofence API routes** (`backend/routes/geofences.py`) with PostGIS spatial queries:

1. CRUD endpoints for geofence management
2. Point-in-polygon containment checks
3. Buffer zone distance calculations
4. Integration with detection flow for auto-assignment

**Estimated Time**: 2-3 hours

Then move to **YOLO Inference Worker** (Phase 4) for laptop camera detection.

---

## ⚠️ Important Notes

1. **PostGIS Requirement**: Database MUST have PostGIS extension enabled
   - Handled automatically by `postgis/postgis` Docker image
   - Manual install: `CREATE EXTENSION postgis;`

2. **YOLO Model Download**: Required before inference worker runs
   ```bash
   mkdir models
   curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o models/yolov8n.pt
   ```

3. **Mapbox Token**: Frontend map requires free Mapbox account
   - Sign up: https://account.mapbox.com/auth/signup/
   - Copy token to `backend/.env`

4. **Weapon Detection**: Off-the-shelf YOLO may not have "weapon" class
   - Fine-tuning guide in README_PRODUCTION.md
   - Use custom dataset from Roboflow or similar

---

**Status**: Backend foundation complete, ready for API route implementation! 🚀
