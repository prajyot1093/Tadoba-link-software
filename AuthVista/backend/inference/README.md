# 🦁 YOLO Inference Worker

Real-time wildlife detection using YOLOv8 for the Tadoba Surveillance System.

## Overview

The YOLO Inference Worker is a Python service that:
- Receives video frames via Socket.IO from webcams or RTSP streams
- Runs YOLOv8 object detection to identify wildlife and human intrusions
- Posts detections to the backend API with bounding boxes
- Broadcasts real-time results to connected clients
- Saves annotated snapshots for incident records

## Features

- **YOLOv8 Integration**: Uses Ultralytics YOLOv8n (nano) model for fast inference
- **Wildlife Detection**: Detects 14+ classes including elephant, bear, bird, person, etc.
- **Real-time Processing**: Socket.IO for low-latency frame processing
- **Snapshot Storage**: Saves annotated frames with bounding boxes
- **Configurable**: Adjust confidence threshold, model path, backend URL
- **Docker Ready**: Dockerfile included for containerized deployment

## Setup

### 1. Download YOLO Model

```bash
cd backend/inference
python download_model.py
```

This downloads `yolov8n.pt` (~6 MB) to `backend/models/`

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and adjust settings:

```bash
cp .env.example .env
```

Edit `.env`:
```env
BACKEND_URL=http://localhost:8000
MODEL_PATH=./models/yolov8n.pt
CONFIDENCE_THRESHOLD=0.5
SNAPSHOT_DIR=./snapshots
```

### 4. Run Worker

```bash
python worker.py
```

## Usage

### With Backend Running

1. Start the FastAPI backend:
   ```bash
   cd backend
   uvicorn main:socket_app --reload
   ```

2. Start the inference worker (separate terminal):
   ```bash
   cd backend/inference
   python worker.py
   ```

3. Send frames from webcam or RTSP stream via Socket.IO

### Frame Format

Send frames to the worker via Socket.IO event `frame:ingest`:

```json
{
  "frame": "base64_encoded_jpeg",
  "camera_id": 1,
  "geofence_id": 2,
  "timestamp": "2025-10-14T12:00:00Z"
}
```

### Detection Response

Worker broadcasts `detection:created` events:

```json
{
  "id": 123,
  "camera_id": 1,
  "geofence_id": 2,
  "detection_class": "elephant",
  "confidence": 0.87,
  "bbox": {
    "x": 640,
    "y": 360,
    "width": 200,
    "height": 300,
    "x1": 540,
    "y1": 210,
    "x2": 740,
    "y2": 510
  },
  "snapshot_path": "./snapshots/cam1_20251014_120000.jpg",
  "timestamp": "2025-10-14T12:00:00Z"
}
```

## Docker Deployment

### Build Image

```bash
cd backend
docker build -f inference/Dockerfile -t tadoba-inference .
```

### Run Container

```bash
docker run -d \
  --name tadoba-inference \
  -e BACKEND_URL=http://backend:8000 \
  -e MODEL_PATH=/app/models/yolov8n.pt \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/snapshots:/app/snapshots \
  tadoba-inference
```

### With Docker Compose

Already configured in `docker-compose.yml`:

```bash
docker-compose up inference
```

## Detected Classes

The worker detects these COCO classes:

| Class ID | Class Name | Priority |
|----------|------------|----------|
| 0        | person     | 🔴 High (intrusion) |
| 1        | bicycle    | Medium |
| 2        | car        | Medium |
| 3        | motorcycle | Medium |
| 14       | bird       | Low |
| 15       | cat        | Low |
| 16       | dog        | Medium |
| 17       | horse      | Medium |
| 18       | sheep      | Low |
| 19       | cow        | Medium |
| 20       | elephant   | 🟢 High (wildlife) |
| 21       | bear       | 🟢 High (wildlife) |
| 22       | zebra      | Medium |
| 23       | giraffe    | Medium |

**Red boxes** = Human intrusion  
**Green boxes** = Wildlife detection

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:8000` | FastAPI backend URL |
| `MODEL_PATH` | `./models/yolov8n.pt` | Path to YOLO model |
| `CONFIDENCE_THRESHOLD` | `0.5` | Detection confidence (0.0-1.0) |
| `SNAPSHOT_DIR` | `./snapshots` | Directory for saved frames |

### Adjusting Confidence

Lower confidence = more detections (may include false positives)
Higher confidence = fewer detections (more accurate)

Recommended:
- **Wildlife monitoring**: 0.4 - 0.5
- **Human intrusion**: 0.6 - 0.7
- **Critical alerts**: 0.7 - 0.8

## Performance

### YOLOv8n (Nano)
- **Model size**: ~6 MB
- **Speed**: 50-100 FPS on CPU
- **Accuracy**: 37.3 mAP on COCO val

### Hardware Requirements

**Minimum (CPU)**:
- 2 CPU cores
- 4 GB RAM
- ~10 FPS processing

**Recommended (GPU)**:
- NVIDIA GPU with CUDA
- 4 GB VRAM
- 60+ FPS processing

## Troubleshooting

### Model Not Found

```
❌ Model not found at: ./models/yolov8n.pt
💡 Run: python download_model.py
```

**Solution**: Download the model first

### Cannot Connect to Backend

```
⚠️ Disconnected from backend
```

**Solution**: Ensure FastAPI backend is running on `BACKEND_URL`

### Slow Inference

**Solutions**:
1. Use GPU: Install `torch` with CUDA support
2. Lower resolution: Resize frames before sending
3. Increase confidence threshold: Fewer detections = faster
4. Use YOLOv8n (nano) model: Fastest variant

### Import Errors

```
Import "cv2" could not be resolved
```

**Solution**: Install dependencies:
```bash
pip install -r requirements.txt
```

## Development

### Test with Static Image

```python
from ultralytics import YOLO
import cv2

model = YOLO('./models/yolov8n.pt')
frame = cv2.imread('test_image.jpg')
results = model.predict(frame, conf=0.5)

for result in results:
    for box in result.boxes:
        print(f"Class: {box.cls}, Confidence: {box.conf}")
```

### Test with Webcam

```python
import cv2
from ultralytics import YOLO

model = YOLO('./models/yolov8n.pt')
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    results = model.predict(frame, conf=0.5)
    annotated = results[0].plot()
    cv2.imshow('YOLO', annotated)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

## API Integration

The worker automatically:
1. Receives frames via Socket.IO (`frame:ingest` event)
2. Runs YOLO inference
3. POSTs detections to `/api/detections/`
4. Broadcasts results via Socket.IO (`detection:created` event)

No manual API calls needed!

## Next Steps

- [x] Download YOLO model
- [x] Install dependencies
- [x] Test with static images
- [ ] Integrate with webcam page (Phase 5)
- [ ] Add RTSP stream support (Phase 6)
- [ ] Implement geofence breach alerts (Phase 7)

## Resources

- [YOLOv8 Documentation](https://docs.ultralytics.com/)
- [Socket.IO Python Client](https://python-socketio.readthedocs.io/)
- [OpenCV Documentation](https://docs.opencv.org/)

---

**Status**: ✅ Ready for testing  
**Next Phase**: Phase 5 - Surveillance Webcam Page
