# Phase 5: Real-Time Webcam Surveillance

Browser-based real-time wildlife detection using webcam and YOLO inference worker.

## Overview

Phase 5 adds a **real-time surveillance page** that captures frames from your webcam, sends them to the YOLO inference worker via Socket.IO, and displays detection results with bounding box overlays.

## Features

### 🎥 Webcam Integration
- WebRTC `getUserMedia` API for camera access
- 1280x720 resolution (HD)
- Automatic camera permission handling
- Clean start/stop controls

### 🔄 Real-Time Processing
- Canvas-based frame capture
- Configurable frame rate (1-10 FPS)
- Base64 JPEG encoding for transmission
- Socket.IO for low-latency communication

### 📊 Detection Overlay
- Canvas 2D rendering for bounding boxes
- Color-coded boxes:
  - **Red** = Person (human intrusion)
  - **Green** = Wildlife (elephant, bear, etc.)
  - **Orange** = Vehicles (car, motorcycle)
- Confidence percentage labels
- Toggle show/hide bboxes

### 📋 Detection List
- Real-time detection feed
- Last 50 detections stored
- Animated entry/exit
- Timestamp and confidence display
- Priority badges (red for person, green for wildlife)

### 📈 Live Statistics
- Frames processed counter
- Total detections count
- Average processing latency (ms)
- Last detection badge overlay

### ⚙️ Configuration
- Camera ID selection (1-3)
- Geofence zone selection (Core/Buffer/Safe)
- Frame rate adjustment (1-10 FPS)
- Detection list toggle
- Fullscreen mode

## Architecture

```
┌─────────────────┐
│   Browser UI    │
│  (React + TS)   │
└────────┬────────┘
         │
         │ 1. getUserMedia()
         │    (WebRTC)
         ▼
┌─────────────────┐
│  Video Element  │
│   (webcam feed) │
└────────┬────────┘
         │
         │ 2. drawImage()
         │    (5 FPS default)
         ▼
┌─────────────────┐
│ Canvas Element  │
│ (frame capture) │
└────────┬────────┘
         │
         │ 3. toDataURL()
         │    (base64 JPEG)
         ▼
┌─────────────────┐
│  Socket.IO      │
│  emit('frame:   │
│  ingest')       │
└────────┬────────┘
         │
         │ 4. WebSocket
         │    (bidirectional)
         ▼
┌─────────────────┐
│ FastAPI Backend │
│ (Socket.IO Hub) │
└────────┬────────┘
         │
         │ 5. Forward frame
         │
         ▼
┌─────────────────┐
│ YOLO Inference  │
│     Worker      │
│   (YOLOv8n)     │
└────────┬────────┘
         │
         │ 6. YOLO.predict()
         │
         ▼
┌─────────────────┐
│  Detections     │
│ (class, conf,   │
│  bbox)          │
└────────┬────────┘
         │
         │ 7. POST /api/
         │    detections/
         │    (PostgreSQL)
         ▼
┌─────────────────┐
│    Database     │
│ (detections)    │
└─────────────────┘
         │
         │ 8. Socket.IO
         │    emit('detection:
         │    created')
         ▼
┌─────────────────┐
│   Browser UI    │
│ (bbox overlay + │
│  detection list)│
└─────────────────┘
```

## Data Flow

### 1. Frame Capture (Client → Backend)

**Event**: `frame:ingest`

```typescript
socket.emit('frame:ingest', {
  frame: 'base64_encoded_jpeg_string',  // ~50-100 KB per frame
  camera_id: 1,
  geofence_id: 2,
  timestamp: '2025-10-14T12:00:00.000Z'
});
```

### 2. Frame Processing (Backend → Inference Worker)

Backend forwards frame to inference worker via Socket.IO.

### 3. Detection Result (Inference Worker → Backend)

**Event**: `detection:created`

```typescript
socket.on('detection:created', (detection) => {
  // detection = {
  //   id: 123,
  //   camera_id: 1,
  //   detection_class: 'elephant',
  //   confidence: 0.87,
  //   bbox: {
  //     x: 640, y: 360,      // Center
  //     width: 200, height: 300,
  //     x1: 540, y1: 210,    // Top-left
  //     x2: 740, y2: 510     // Bottom-right
  //   },
  //   timestamp: '2025-10-14T12:00:00.123Z',
  //   snapshot_path: './snapshots/cam1_...'
  // }
});
```

### 4. Frame Processed Status

**Event**: `frame:processed`

```typescript
socket.on('frame:processed', (data) => {
  // data = {
  //   camera_id: 1,
  //   timestamp: '2025-10-14T12:00:00.123Z',
  //   detections_count: 2,
  //   processing_time_ms: 85,
  //   detections: [...]  // Array of detections
  // }
});
```

## File Structure

```
client/src/pages/surveillance/
├── index.tsx              ✅ Surveillance dashboard (existing)
├── real-time.tsx          ✅ NEW - Webcam surveillance page
└── detection-detail.tsx   ✅ Detection details (existing)
```

## Usage

### 1. Start Backend & Inference Worker

```bash
# Terminal 1: Backend
cd backend
uvicorn main:socket_app --reload

# Terminal 2: Inference Worker
cd backend/inference
python worker.py
```

### 2. Start Frontend

```bash
# Terminal 3: Frontend
cd client
npm run dev
```

### 3. Navigate to Real-Time Surveillance

Open browser: `http://localhost:5173/surveillance/real-time`

### 4. Grant Camera Permission

Click "Start Streaming" → Allow camera access when prompted

### 5. Adjust Settings

- **Frame Rate**: 1-10 FPS (default: 5 FPS)
- **Camera ID**: Select camera (default: 1)
- **Geofence**: Select zone (Core/Buffer/Safe)

### 6. Monitor Detections

- Watch live video feed with bbox overlays
- View detection list in sidebar
- Check stats (frames, detections, latency)

## Component Breakdown

### State Management

```typescript
// Streaming state
const [isStreaming, setIsStreaming] = useState(false);
const [isConnected, setIsConnected] = useState(false);

// Configuration
const [selectedCamera, setSelectedCamera] = useState('1');
const [selectedGeofence, setSelectedGeofence] = useState('1');
const [frameRate, setFrameRate] = useState(5);

// UI state
const [showBboxes, setShowBboxes] = useState(true);
const [showDetectionList, setShowDetectionList] = useState(true);
const [isFullscreen, setIsFullscreen] = useState(false);

// Data
const [detections, setDetections] = useState<Detection[]>([]);
const [stats, setStats] = useState({
  framesProcessed: 0,
  totalDetections: 0,
  avgProcessingTime: 0,
  lastDetection: null
});
```

### Refs

```typescript
// DOM refs
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Stream refs
const streamRef = useRef<MediaStream | null>(null);
const socketRef = useRef<Socket | null>(null);
const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

### Key Functions

#### `startWebcam()`
Requests camera access and initializes video stream.

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720, facingMode: 'user' },
  audio: false
});
videoRef.current.srcObject = stream;
```

#### `captureAndSendFrame()`
Captures frame from video, converts to base64, sends via Socket.IO.

```typescript
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
const frameData = canvas.toDataURL('image/jpeg', 0.8);
const base64Frame = frameData.split(',')[1];

socket.emit('frame:ingest', {
  frame: base64Frame,
  camera_id: parseInt(selectedCamera),
  geofence_id: parseInt(selectedGeofence),
  timestamp: new Date().toISOString()
});
```

#### `drawBoundingBoxes(detections)`
Draws detection bboxes on canvas overlay.

```typescript
detections.forEach(detection => {
  const { bbox, detection_class, confidence } = detection;
  
  // Color based on class
  let color = '#00FF00'; // Green
  if (detection_class === 'person') color = '#FF0000'; // Red
  
  // Draw rectangle
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x1, y1, width, height);
  
  // Draw label
  const label = `${detection_class} ${(confidence * 100).toFixed(0)}%`;
  ctx.fillText(label, x1 + 5, y1 - 8);
});
```

#### `toggleStreaming()`
Starts/stops webcam and frame capture interval.

```typescript
if (isStreaming) {
  clearInterval(frameIntervalRef.current);
  stopWebcam();
  setIsStreaming(false);
} else {
  await startWebcam();
  setIsStreaming(true);
  
  frameIntervalRef.current = setInterval(() => {
    captureAndSendFrame();
  }, 1000 / frameRate);
}
```

## Configuration

### Frame Rate

**Low (1-2 FPS)**:
- Reduces bandwidth (~100 KB/s)
- Lower inference load
- Suitable for slow-moving wildlife

**Medium (3-5 FPS)**:
- Balanced performance (recommended)
- ~300-500 KB/s bandwidth
- Good for general monitoring

**High (6-10 FPS)**:
- Real-time responsiveness
- ~600 KB/s - 1 MB/s bandwidth
- Best for fast-moving objects

### Camera Selection

- **Camera 1**: Webcam (default)
- **Camera 2**: External camera (if available)
- **Camera 3**: Secondary camera

### Geofence Zones

- **Core Zone (ID: 1)**: Critical area, high-priority alerts
- **Buffer Zone (ID: 2)**: Medium-priority monitoring
- **Safe Zone (ID: 3)**: Low-priority tracking

## Performance

### Browser Requirements

- **Minimum**: Chrome 90+, Firefox 88+, Safari 14+
- **WebRTC Support**: Required
- **Canvas 2D**: Required

### Network

- **Bandwidth**: ~500 KB/s @ 5 FPS
- **Latency**: 50-200ms (local network)
- **WebSocket**: Persistent connection

### Resource Usage

- **CPU**: 5-15% (frame capture + canvas rendering)
- **Memory**: ~100 MB (React + video buffers)
- **GPU**: Minimal (canvas 2D only)

## Troubleshooting

### Camera Not Working

**Issue**: "Failed to access camera" error

**Solutions**:
1. Check browser permissions (chrome://settings/content/camera)
2. Ensure HTTPS or localhost (required for getUserMedia)
3. Close other apps using camera
4. Try different browser

### Socket.IO Not Connecting

**Issue**: "Disconnected" status, no detections

**Solutions**:
1. Ensure backend is running (`uvicorn main:socket_app`)
2. Check CORS settings in backend
3. Verify Socket.IO port (default: 8000)
4. Check browser console for errors

### No Detections Appearing

**Issue**: Streaming works, but no detections

**Solutions**:
1. Ensure inference worker is running (`python worker.py`)
2. Check worker logs for errors
3. Verify model is downloaded (`models/yolov8n.pt`)
4. Lower confidence threshold in worker (default: 0.5)

### Bounding Boxes Not Aligned

**Issue**: Bboxes don't match detected objects

**Solutions**:
1. Check canvas/video size mismatch
2. Verify bbox coordinate scaling
3. Ensure video has loaded (`onloadedmetadata`)

### High Latency

**Issue**: Detection appears 2-3 seconds after object moves

**Solutions**:
1. Lower frame rate (less inference load)
2. Use GPU for inference (CUDA)
3. Reduce video resolution
4. Check network latency

## Testing

### Manual Test

1. Start backend + inference worker
2. Open `/surveillance/real-time`
3. Click "Start Streaming"
4. Hold object in front of camera:
   - **Person**: Should get red bbox
   - **Phone/Cup**: May detect as various objects
   - **Pet**: Should detect as cat/dog

### Expected Behavior

- ✅ Webcam starts immediately
- ✅ Frame counter increments every 0.2s (@ 5 FPS)
- ✅ Detections appear in sidebar
- ✅ Bboxes drawn on video
- ✅ Stats update in real-time
- ✅ Toast notifications for high-confidence detections

## Known Limitations

1. **Browser Only**: Webcam access requires browser (no mobile app yet)
2. **Local Network**: Best performance on localhost/LAN
3. **Single Camera**: Only one webcam stream at a time
4. **No Recording**: Doesn't save video (only snapshots on server)
5. **COCO Classes**: Limited to 80 COCO classes

## Future Enhancements

- [ ] Multiple simultaneous webcams
- [ ] Video recording with H.264 encoding
- [ ] Mobile app with camera access
- [ ] Custom wildlife model training
- [ ] Frame buffer for smooth playback
- [ ] Screen sharing (desktop surveillance)

## Resources

- [WebRTC getUserMedia API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Framer Motion](https://www.framer.com/motion/)

---

**Phase 5 Component**: ✅ **COMPLETE**  
**Lines of Code**: 650+ lines  
**Next**: Add UI polish and testing (Commit 3/4)
