# 🌲 Tadoba API Routes - Phase 3 Complete

## ✅ What's Been Implemented

### API Endpoints Ready for Use

#### **1. Geofences API** (`/api/geofences`)

Create, manage, and query geofences with PostGIS spatial operations:

- ✅ `POST /api/geofences/` - Create geofence with GeoJSON polygon
- ✅ `GET /api/geofences/` - List all geofences (with filtering)
- ✅ `GET /api/geofences/{id}` - Get single geofence
- ✅ `PUT /api/geofences/{id}` - Update geofence
- ✅ `DELETE /api/geofences/{id}` - Soft delete geofence
- ✅ `POST /api/geofences/check` - Check point-in-polygon containment
- ✅ `POST /api/geofences/check-distance` - Find geofences within distance
- ✅ `GET /api/geofences/stats/summary` - Get geofence statistics

**Key Features:**
- Server-side spatial queries with PostGIS `ST_Contains`, `ST_DWithin`
- Automatic GeoJSON conversion (store as geometry, return as GeoJSON)
- Zone types: Core (high priority), Buffer (early warning), Safe (tracking)
- Permission checks (creator or admin can edit/delete)

#### **2. Cameras API** (`/api/cameras`)

Manage camera registrations and status:

- ✅ `POST /api/cameras/` - Register new camera
- ✅ `GET /api/cameras/` - List cameras (filter by type/status)
- ✅ `GET /api/cameras/{id}` - Get camera details
- ✅ `PUT /api/cameras/{id}` - Update camera
- ✅ `DELETE /api/cameras/{id}` - Soft delete camera
- ✅ `POST /api/cameras/{id}/heartbeat` - Update last_seen timestamp
- ✅ `GET /api/cameras/stats/summary` - Camera statistics

**Supported Types:**
- `laptop` - Browser webcam
- `rtsp` - RTSP stream (dashcam, IP camera)
- `ip` - IP camera
- `dashcam` - Vehicle-mounted camera

#### **3. Detections API** (`/api/detections`)

Record and query YOLO detections:

- ✅ `POST /api/detections/` - Create detection record
- ✅ `GET /api/detections/` - List detections (with filtering)
- ✅ `GET /api/detections/{id}` - Get single detection
- ✅ `GET /api/detections/stats/summary` - Detection statistics
- ✅ `GET /api/detections/heatmap/data` - Heatmap coordinates

**Auto-Assignment:**
- Detections with lat/lon automatically assigned to containing geofence
- PostGIS spatial query: `ST_Contains(geofence.geometry, detection.location)`

---

## 🧪 Testing the API

### Prerequisites

1. Start the backend:
   ```bash
   cd backend
   uvicorn main:socket_app --reload
   ```

2. Install requests library (if not already):
   ```bash
   pip install requests
   ```

### Run Test Suite

```bash
cd backend
python test_api.py
```

**Expected Output:**
```
🚀 Starting API Tests...
   Base URL: http://localhost:8000

🔐 Testing Authentication...
✅ User registered successfully
✅ Login successful

🗺️  Testing Geofences...
✅ Geofence created: ID 1, Name: Core Zone Alpha
✅ Retrieved 1 geofences
✅ Point is inside geofence: Core Zone Alpha
✅ Geofence stats: 1 total, 1 active

📹 Testing Cameras...
✅ Camera created: ID 1, Name: North Gate Camera
✅ Retrieved 1 cameras
✅ Camera heartbeat sent
✅ Camera stats: 1 total, 1 online

🔍 Testing Detections...
✅ Detection created: ID 1, Class: person
   Auto-assigned to geofence ID: 1
✅ Retrieved 1 detections
✅ Detection stats: 1 in last 24 hours
✅ Heatmap data: 1 points

✅ All tests completed!
```

---

## 📖 API Usage Examples

### 1. Create a Geofence (Core Zone)

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | jq -r '.access_token')

# Create core zone
curl -X POST http://localhost:8000/api/geofences/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tiger Reserve Core",
    "zone_type": "core",
    "description": "No human entry allowed",
    "color": "#ef4444",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [79.33, 20.23],
        [79.35, 20.23],
        [79.35, 20.25],
        [79.33, 20.25],
        [79.33, 20.23]
      ]]
    },
    "properties": {
      "patrol_frequency": "continuous",
      "alert_priority": "critical"
    }
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Tiger Reserve Core",
  "zone_type": "core",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[79.33, 20.23], ...]]
  },
  "description": "No human entry allowed",
  "color": "#ef4444",
  "properties": {"patrol_frequency": "continuous"},
  "is_active": true,
  "created_by": 1,
  "created_at": "2025-10-14T12:00:00"
}
```

### 2. Check if Point is Inside Geofence

```bash
curl -X POST "http://localhost:8000/api/geofences/check?lat=20.24&lon=79.34" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (inside):**
```json
{
  "contained": true,
  "geofence": {
    "id": 1,
    "name": "Tiger Reserve Core",
    "zone_type": "core",
    "color": "#ef4444",
    "description": "No human entry allowed"
  }
}
```

**Response (outside):**
```json
{
  "contained": false,
  "geofence": null,
  "message": "Point is not inside any active geofence"
}
```

### 3. Register a Camera

```bash
curl -X POST http://localhost:8000/api/cameras/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Webcam",
    "type": "laptop",
    "latitude": 20.2347,
    "longitude": 79.3401,
    "metadata": {
      "device_id": "laptop-001",
      "resolution": "1280x720"
    }
  }'
```

### 4. Create Detection (from YOLO)

```bash
curl -X POST http://localhost:8000/api/detections/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "camera_id": 1,
    "detection_class": "person",
    "confidence": 0.95,
    "bbox": {
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 80
    },
    "snapshot_url": "/snapshots/detection_001.jpg",
    "frame_id": "frame_12345",
    "latitude": 20.24,
    "longitude": 79.34
  }'
```

**Response:**
```json
{
  "id": 1,
  "camera_id": 1,
  "detection_class": "person",
  "confidence": 0.95,
  "bbox": {"x": 100, "y": 200, "width": 50, "height": 80},
  "snapshot_url": "/snapshots/detection_001.jpg",
  "latitude": 20.24,
  "longitude": 79.34,
  "geofence_id": 1,  // Auto-assigned!
  "detected_at": "2025-10-14T12:05:00"
}
```

### 5. Get Detection Heatmap Data

```bash
curl "http://localhost:8000/api/detections/heatmap/data?hours=24&detection_class=person" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "period_hours": 24,
  "detection_class": "person",
  "points": [
    [20.24, 79.34, 5],  // [lat, lon, intensity]
    [20.25, 79.35, 3],
    [20.23, 79.33, 8]
  ],
  "total_points": 3
}
```

---

## 🔧 Integration with Frontend

### Fetch Geofences for Map Display

```typescript
// client/src/lib/api.ts
export async function getGeofences(token: string) {
  const response = await fetch('http://localhost:8000/api/geofences/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### Display on Mapbox

```typescript
// client/src/pages/map-with-geofences.tsx
import mapboxgl from 'mapbox-gl';

const geofences = await getGeofences(token);

geofences.forEach(geofence => {
  map.addSource(`geofence-${geofence.id}`, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: geofence.geometry
    }
  });
  
  map.addLayer({
    id: `geofence-${geofence.id}`,
    type: 'fill',
    source: `geofence-${geofence.id}`,
    paint: {
      'fill-color': geofence.color,
      'fill-opacity': 0.3,
      'fill-outline-color': geofence.color
    }
  });
});
```

### Stream Detections via WebSocket

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

socket.on('detection:create', (detection) => {
  console.log('New detection:', detection);
  
  // Add marker to map
  new mapboxgl.Marker({ color: detection.geofence_id ? 'red' : 'yellow' })
    .setLngLat([detection.longitude, detection.latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`
      <h3>${detection.detection_class}</h3>
      <p>Confidence: ${(detection.confidence * 100).toFixed(1)}%</p>
      <p>Camera: ${detection.camera_id}</p>
    `))
    .addTo(map);
});
```

---

## 📊 API Documentation (Swagger UI)

Once the server is running, visit:

**http://localhost:8000/docs**

Interactive API documentation with:
- All endpoints listed
- Request/response schemas
- Try it out functionality
- Authentication testing

Alternative ReDoc version:

**http://localhost:8000/redoc**

---

## 🔐 Authentication Flow

All API routes (except `/health`) require JWT authentication:

1. **Register** or **Login** to get JWT token
2. Include token in `Authorization` header: `Bearer <token>`
3. Token expires after 24 hours (configurable in `.env`)

### Example with curl:

```bash
# Login
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  | jq -r '.access_token')

# Use token in subsequent requests
curl http://localhost:8000/api/geofences/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 Next Steps (Phase 4)

Now that API routes are complete, the next priority is:

### **Phase 4: YOLO Inference Worker**

Create `inference/worker.py` to:

1. Connect to FastAPI backend via Socket.IO
2. Listen for frame events from webcam
3. Run YOLOv8 inference on each frame
4. Call `POST /api/detections/` to persist results
5. Broadcast detection events to all clients

**Estimated Time:** 4-5 hours

---

## 📝 Files Created in Phase 3

```
backend/routes/
├── __init__.py              ✅ Package initialization
├── geofences.py             ✅ 8 endpoints + PostGIS queries
├── cameras.py               ✅ 7 endpoints + heartbeat
└── detections.py            ✅ 6 endpoints + heatmap data

backend/
├── main.py                  ✅ Updated with route registration
└── test_api.py              ✅ Comprehensive test suite
```

---

## ✅ Phase 3 Complete!

**Summary:**
- ✅ 21 API endpoints implemented
- ✅ PostGIS spatial queries (ST_Contains, ST_DWithin)
- ✅ Auto-assignment of detections to geofences
- ✅ Heatmap data generation
- ✅ Camera heartbeat monitoring
- ✅ Permission checks (RBAC)
- ✅ Comprehensive test suite
- ✅ Ready for frontend integration

**Ready for Phase 4: YOLO Inference Worker! 🚀**
