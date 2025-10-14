# Tadoba Wildlife Surveillance System

A production-grade, real-time wildlife monitoring platform with YOLO object detection, geofencing, and immersive forest-themed UI.

## 🌲 Features

- **Real-time YOLO Detection**: Detect humans, vehicles, weapons, and wildlife using YOLOv8
- **Geofencing**: Core/Buffer/Safe zone management with PostGIS spatial queries
- **Live Surveillance**: Laptop webcam + RTSP dashcam support
- **Interactive Map**: Mapbox GL JS with detection heatmaps and incident timeline
- **Real Database**: PostgreSQL + PostGIS for spatial data
- **WebSocket Alerts**: Real-time notifications for geofence breaches and threats
- **Forest Theme UI**: Glassmorphism design with blurred jungle backgrounds

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│  React Frontend │ ◄──────────────── │  FastAPI Backend │
│  (Tailwind UI) │                    │   (Python 3.11)  │
└─────────────────┘                    └──────────────────┘
         │                                      │
         │                                      ▼
         │                              ┌──────────────────┐
         │                              │  PostgreSQL +    │
         │                              │     PostGIS      │
         │                              └──────────────────┘
         │                                      
         ▼                                      ▼
┌─────────────────┐     Frames         ┌──────────────────┐
│  Webcam/RTSP    │ ──────────────────►│  YOLO Inference  │
│   Streams       │                    │     Worker       │
└─────────────────┘                    └──────────────────┘
```

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker & Docker Compose
- 4GB RAM minimum (8GB recommended)
- Python 3.11+
- Node.js 18+

### 1. Clone and Setup

```bash
git clone <your-repo>
cd AuthVista

# Create .env from sample
cp backend/.env.sample backend/.env
```

### 2. Download YOLO Model

```bash
# Create models directory
mkdir -p models

# Download YOLOv8 nano model (lightweight, CPU-friendly)
curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o models/yolov8n.pt

# Or download medium model (better accuracy, requires more resources)
# curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8m.pt -o models/yolov8m.pt
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Services will be available at:
# - Frontend: http://localhost
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432
```

### 4. Create Admin User

```bash
# Access backend container
docker exec -it tadoba_backend bash

# Run Python shell
python

# Create admin user
from database import SessionLocal
from models import User
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

admin = User(
    email="admin@tadoba.com",
    username="admin",
    full_name="System Administrator",
    hashed_password=pwd_context.hash("admin123"),
    role="admin",
    is_active=True
)
db.add(admin)
db.commit()
print("✅ Admin user created: admin / admin123")
```

## 🔧 Development Setup (Without Docker)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup PostgreSQL with PostGIS
# Install PostgreSQL 15 and PostGIS extension
# Create database: tadoba_surveillance

# Run migrations
alembic upgrade head

# Start backend
uvicorn main:socket_app --reload --port 8000
```

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Inference Worker Setup

```bash
cd inference

# Install dependencies
pip install -r requirements.txt

# Download YOLO model
mkdir models
curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o models/yolov8n.pt

# Start inference worker
python worker.py
```

## 📊 Database Schema

### Core Tables
- **users**: Authentication and role-based access
- **geofences**: Polygon zones (core/buffer/safe) with PostGIS geometry
- **cameras**: Laptop/RTSP/IP cameras with geolocation
- **detections**: YOLO detections with bounding boxes and snapshots
- **incidents**: High-priority alerts with assignment workflow
- **animals**: Wildlife tracking with GPS collar data

### Spatial Queries

```python
# Check if detection is inside core zone
from sqlalchemy import func
from geoalchemy2 import WKTElement

point = WKTElement(f'POINT({lon} {lat})', srid=4326)
geofence = db.query(Geofence).filter(
    func.ST_Contains(Geofence.geometry, point),
    Geofence.zone_type == 'core'
).first()
```

## 🎥 Surveillance Integration

### Laptop Webcam

```javascript
// Frontend: Capture webcam frames
const stream = await navigator.mediaDevices.getUserMedia({ 
  video: { width: 1280, height: 720 } 
});

// Send frames to backend via WebSocket
const canvas = document.createElement('canvas');
setInterval(() => {
  canvas.getContext('2d').drawImage(video, 0, 0);
  const frame = canvas.toDataURL('image/jpeg', 0.8);
  socket.emit('frame', { camera_id: 1, frame });
}, 200); // 5 FPS
```

### RTSP Dashcam

```python
# Backend: Ingest RTSP stream with ffmpeg
import subprocess
import cv2

process = subprocess.Popen([
    'ffmpeg',
    '-rtsp_transport', 'tcp',
    '-i', rtsp_url,
    '-f', 'image2pipe',
    '-vf', 'fps=5',
    '-vcodec', 'rawvideo',
    '-pix_fmt', 'bgr24',
    '-'
], stdout=subprocess.PIPE, bufsize=10**8)

# Read frames
while True:
    raw_frame = process.stdout.read(width * height * 3)
    frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape((height, width, 3))
    # Send to YOLO inference
```

## 🗺️ Geofencing

### Create Geofence

```javascript
// Frontend: Draw polygon on Mapbox
const polygon = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[lon1, lat1], [lon2, lat2], ...]]
  }
};

await fetch('/api/geofences', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Core Zone A',
    zone_type: 'core',
    geometry: polygon.geometry,
    color: '#ef4444'
  })
});
```

### Server-side Breach Detection

```python
# Backend: Check geofence breach on detection
from geoalchemy2.functions import ST_Contains
from geoalchemy2 import WKTElement

def check_geofence_breach(lat: float, lon: float, db: Session):
    point = WKTElement(f'POINT({lon} {lat})', srid=4326)
    
    # Find containing geofence
    geofence = db.query(Geofence).filter(
        ST_Contains(Geofence.geometry, point),
        Geofence.is_active == True
    ).first()
    
    if geofence and geofence.zone_type == 'core':
        # Trigger high-priority alert
        create_incident(detection, priority='critical')
        broadcast_alert(f'⚠️ Breach in {geofence.name}')
```

## 🤖 YOLO Detection

### Supported Classes
- **Security**: person, car, truck, motorcycle, weapon
- **Wildlife**: tiger, leopard, elephant, deer, wild_dog, sloth_bear

### Fine-tuning for Weapon Detection

```bash
# Install Ultralytics CLI
pip install ultralytics

# Download custom weapon dataset (example: Roboflow)
# https://universe.roboflow.com/weapon-detection/weapons-dataset

# Train custom model
yolo train data=weapon_dataset.yaml model=yolov8n.pt epochs=50 imgsz=640

# Use fine-tuned model
YOLO_MODEL_PATH=./models/yolov8n_weapon.pt python worker.py
```

## 🚀 Deployment

### Production Deployment (Kubernetes)

```bash
# Build images
docker build -t tadoba-backend:latest ./backend
docker build -t tadoba-frontend:latest ./client
docker build -t tadoba-inference:latest ./inference

# Push to registry
docker push your-registry/tadoba-backend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### Environment Variables (Production)

```env
# Backend
DATABASE_URL=postgresql://user:pass@postgres:5432/tadoba
SECRET_KEY=<generate-with-openssl-rand-hex-32>
MAPBOX_ACCESS_TOKEN=pk.your-production-token
USE_S3=true
AWS_ACCESS_KEY_ID=your-key
S3_BUCKET_NAME=tadoba-prod-snapshots

# Enable HTTPS
SSL_CERT_PATH=/etc/ssl/certs/tadoba.crt
SSL_KEY_PATH=/etc/ssl/private/tadoba.key
```

## 📖 API Documentation

### Authentication

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=admin&password=admin123"

# Use token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/auth/me
```

### Geofences

```bash
# Create geofence
curl -X POST http://localhost:8000/api/geofences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Core Zone A",
    "zone_type": "core",
    "geometry": {"type": "Polygon", "coordinates": [...]},
    "color": "#ef4444"
  }'

# List geofences
curl http://localhost:8000/api/geofences \
  -H "Authorization: Bearer <token>"
```

### Detections

```bash
# Get recent detections
curl "http://localhost:8000/api/detections?limit=50&class=person" \
  -H "Authorization: Bearer <token>"
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Test geofence logic
pytest tests/test_geofences.py::test_containment

# Test YOLO inference
pytest tests/test_inference.py::test_detection
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Email: support@tadoba-surveillance.com
