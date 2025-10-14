# 🎯 COMPLETE REAL AI INTEGRATION ROADMAP
## From Mock Detection to Production YOLO System

**Document Created:** October 14, 2025 - 1:45 PM  
**Current Status:** Mock detection system working  
**Goal:** Integrate real YOLO AI for wildlife surveillance  
**Timeline:** Post-hackathon (Weeks 1-4)

---

## 📊 EXECUTIVE SUMMARY

### ✅ Current System (Hackathon Demo)
- **Mock AI Service:** Simulates detection without ML
- **Classes:** person, car, truck, motorcycle, bicycle
- **Processing:** 500-1500ms simulated delay
- **Confidence:** 60-95% randomized
- **Threat Levels:** low/medium/high/critical
- **Status:** ✅ Perfect for demo - reliable, fast, no dependencies

### 🎯 Future Production System
- **Real YOLOv8:** Actual object detection
- **Wildlife Classes:** tiger, leopard, elephant, deer, human, vehicle, poacher
- **Processing:** 50-200ms on GPU, real-time
- **Confidence:** Real AI scores (85-98% accuracy)
- **Camera Integration:** RTSP streams, continuous monitoring
- **Status:** ⏳ Planned for post-hackathon deployment

---

## 🔄 4-PHASE MIGRATION STRATEGY

```
Phase 1 (NOW) → Phase 2 (Week 1) → Phase 3 (Weeks 2-3) → Phase 4 (Week 4+)
Mock Detection   TensorFlow.js      Custom YOLOv8      IP Cameras
     ✅               ⏳                   ⏳                 ⏳
   0 hours         2-3 days          1-2 weeks          2-3 weeks
```

---

## 📋 PHASE 1: MOCK SYSTEM (CURRENT) ✅

**Status:** Complete  
**Purpose:** Fast hackathon demo without ML complexity

### What We Have

**File:** `server/surveillance/mock-detection.ts`

```typescript
export function mockDetection(imageUrl: string): DetectionResult {
  // Randomly select object class
  const classes = ['person', 'car', 'truck', 'motorcycle', 'bicycle'];
  const randomClass = classes[Math.floor(Math.random() * classes.length)];
  
  // Generate realistic bounding box
  const bbox = {
    x: Math.random() * 0.5,        // 0-0.5 normalized
    y: Math.random() * 0.5,        // 0-0.5 normalized
    width: 0.2 + Math.random() * 0.3,  // 0.2-0.5
    height: 0.2 + Math.random() * 0.3  // 0.2-0.5
  };
  
  // Generate confidence score
  const confidence = 0.6 + Math.random() * 0.35;  // 60-95%
  
  return {
    detections: [{ class: randomClass, confidence, bbox }],
    detectionCount: 1,
    threatLevel: calculateThreat([randomClass]),
    timestamp: new Date().toISOString()
  };
}

// Simulated processing delay
export async function processFrame(imageUrl: string): Promise<DetectionResult> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return mockDetection(imageUrl);
}
```

### Benefits for Hackathon
- ✅ **Zero dependencies** - No TensorFlow installation
- ✅ **Instant startup** - No model loading (5-10 second wait)
- ✅ **Predictable** - Always returns results
- ✅ **Fast demo** - No complex ML debugging
- ✅ **Works everywhere** - No GPU required

### Keep Mock for:
- Hackathon presentation
- Local development
- Automated testing
- Fallback if real AI fails

---

## 🚀 PHASE 2: TENSORFLOW.JS + COCO-SSD

**Timeline:** Week 1 post-hackathon (2-3 days)  
**Complexity:** Medium  
**Hardware:** CPU or GPU

### Why This Phase?
- Quick path to real AI (80 pre-trained classes)
- No custom training required
- Works with existing images
- Good for initial production

### Installation

```bash
# For CPU
npm install @tensorflow/tfjs-node @tensorflow-models/coco-ssd

# For GPU (NVIDIA CUDA required)
npm install @tensorflow/tfjs-node-gpu @tensorflow-models/coco-ssd
```

### Implementation

**File:** `server/surveillance/tensorflow-detection.ts` (NEW)

```typescript
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { DetectionResult, DetectedObject } from './mock-detection';

let model: cocoSsd.ObjectDetection | null = null;

// Load model once at server startup
export async function loadTensorFlowModel() {
  console.log('🤖 Loading COCO-SSD model...');
  model = await cocoSsd.load({
    base: 'mobilenet_v2'  // or 'lite_mobilenet_v2' for faster
  });
  console.log('✅ Model loaded successfully');
}

// Detect objects in image
export async function detectWithTensorFlow(imageBuffer: Buffer): Promise<DetectionResult> {
  if (!model) {
    throw new Error('Model not loaded. Call loadTensorFlowModel() first.');
  }

  // Decode image buffer to tensor
  const imageTensor = tf.node.decodeImage(imageBuffer);
  
  // Run detection
  const predictions = await model.detect(imageTensor);
  
  // Clean up tensor to prevent memory leak
  imageTensor.dispose();
  
  // Convert to our format
  const imageHeight = imageTensor.shape[0];
  const imageWidth = imageTensor.shape[1];
  
  const detections: DetectedObject[] = predictions.map(pred => ({
    class: pred.class,
    confidence: pred.score,
    bbox: {
      x: pred.bbox[0] / imageWidth,      // normalize to 0-1
      y: pred.bbox[1] / imageHeight,
      width: pred.bbox[2] / imageWidth,
      height: pred.bbox[3] / imageHeight
    }
  }));
  
  return {
    detections,
    detectionCount: detections.length,
    threatLevel: calculateThreatLevel(detections),
    timestamp: new Date().toISOString()
  };
}

function calculateThreatLevel(detections: DetectedObject[]): 'low' | 'medium' | 'high' | 'critical' {
  const hasPerson = detections.some(d => d.class === 'person');
  const hasVehicle = detections.some(d => ['car', 'truck', 'bus'].includes(d.class));
  const highConfidence = detections.some(d => d.confidence > 0.8);
  
  if (hasPerson && hasVehicle && highConfidence) return 'critical';
  if (hasPerson && highConfidence) return 'high';
  if (hasVehicle || hasPerson) return 'medium';
  return 'low';
}
```

### Update Server to Use Real Detection

**File:** `server/index.ts` (MODIFY)

```typescript
import { loadTensorFlowModel } from './surveillance/tensorflow-detection';

(async () => {
  try {
    console.log('🚀 Starting Tadoba Conservation System...');
    
    // Load AI model at startup
    await loadTensorFlowModel();
    
    // ... rest of server initialization
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();
```

**File:** `server/routes.ts` (MODIFY)

```typescript
// Switch between mock and real detection
import { detectWithTensorFlow } from './surveillance/tensorflow-detection';
import { processFrame as mockProcessFrame } from './surveillance/mock-detection';

const USE_REAL_AI = process.env.USE_REAL_AI === 'true';

app.post('/api/surveillance/process-frame', 
  isAuthenticated, 
  upload.single('image'), 
  async (req, res) => {
    try {
      const { camera_id } = req.body;
      const imageFile = req.file;
      
      if (!camera_id || !imageFile) {
        return res.status(400).json({ message: 'Camera ID and image required' });
      }
      
      // Use real or mock detection based on environment
      const result = USE_REAL_AI 
        ? await detectWithTensorFlow(imageFile.buffer)
        : await mockProcessFrame(imageFile.buffer.toString('base64'));
      
      // Save detection to database
      const detection = await storage.createDetection({
        camera_id,
        image_url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`,
        detected_objects: result.detections,
        detection_count: result.detectionCount,
        threat_level: result.threatLevel,
      });
      
      // Broadcast real-time alert
      if (result.detectionCount > 0) {
        broadcastAlert({
          type: 'detection',
          detectionId: detection.id,
          camera_id,
          ...result
        });
      }
      
      res.json(detection);
    } catch (error) {
      console.error('Detection error:', error);
      res.status(500).json({ message: 'Failed to process image' });
    }
  }
);
```

### Environment Configuration

**File:** `.env`

```env
# Toggle between mock and real AI
USE_REAL_AI=true

# TensorFlow settings
TF_CPP_MIN_LOG_LEVEL=2  # Reduce TensorFlow logs
```

### Testing

```bash
# Start server with real AI
USE_REAL_AI=true npm run dev

# Upload test image
curl -X POST http://localhost:5000/api/surveillance/process-frame \
  -H "Authorization: Bearer $TOKEN" \
  -F "camera_id=camera-1" \
  -F "image=@test-images/person.jpg"

# Expected response:
{
  "id": "uuid",
  "camera_id": "camera-1",
  "detected_objects": [
    {
      "class": "person",
      "confidence": 0.94,
      "bbox": {"x": 0.3, "y": 0.2, "width": 0.25, "height": 0.6}
    },
    {
      "class": "car",
      "confidence": 0.87,
      "bbox": {"x": 0.6, "y": 0.5, "width": 0.3, "height": 0.3}
    }
  ],
  "detection_count": 2,
  "threat_level": "critical",
  "timestamp": "2025-10-14T13:45:00.000Z"
}
```

### COCO-SSD Classes (80 total)

Relevant for Tadoba:
- **Humans:** person
- **Vehicles:** car, truck, bus, motorcycle, bicycle
- **Animals:** bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe

Not included (need Phase 3):
- ❌ tiger, leopard, deer, wild boar (require custom training)

### Performance
- **Model size:** 25-30MB download
- **Loading time:** 5-10 seconds
- **Inference (CPU):** 100-300ms per image
- **Inference (GPU):** 20-50ms per image
- **Memory:** ~200MB
- **Accuracy:** 60-70% on wildlife (not optimized for it)

---

## 🐯 PHASE 3: CUSTOM YOLOV8 (WILDLIFE-SPECIFIC)

**Timeline:** Weeks 2-3 post-hackathon  
**Complexity:** High  
**Hardware:** GPU for training (can use Google Colab free tier)

### Why Custom Model?
- ✅ Detect tiger, leopard, elephant, deer
- ✅ Distinguish poachers from tourists
- ✅ Higher accuracy (85-98% vs 60-70%)
- ✅ Faster inference (50-100ms vs 100-300ms)
- ✅ Smaller model size with quantization

### Step 1: Collect Wildlife Dataset

**Dataset Requirements:**
- 1000-5000 images minimum
- Multiple angles, lighting conditions
- Diverse backgrounds
- Balanced classes (similar count per class)

**Sources:**
1. **Tadoba Camera Traps** (best - your own data)
2. **LILA BC** - https://lila.science/ (wildlife camera traps)
3. **iNaturalist** - https://www.inaturalist.org/
4. **Roboflow Universe** - https://universe.roboflow.com/
5. **Manual collection** - Google Images, YouTube frames

**Dataset Structure:**
```
wildlife-dataset/
├── images/
│   ├── train/        # 70% of data (700-3500 images)
│   │   ├── tiger_001.jpg
│   │   ├── tiger_002.jpg
│   │   ├── leopard_001.jpg
│   │   └── ...
│   ├── val/          # 20% of data (200-1000 images)
│   └── test/         # 10% of data (100-500 images)
└── labels/
    ├── train/        # YOLO format .txt files
    │   ├── tiger_001.txt
    │   ├── tiger_002.txt
    │   └── ...
    └── val/
```

### Step 2: Label Dataset

**Tool: Roboflow (Recommended)**
```
1. Sign up at https://roboflow.com/
2. Create project "Tadoba Wildlife Detection"
3. Upload images
4. Draw bounding boxes around objects
5. Assign class labels
6. Export in YOLOv8 format
```

**Label Format (YOLO .txt):**
```
# Each line: class_id center_x center_y width height (all normalized 0-1)
0 0.5 0.5 0.3 0.4    # Tiger at center
1 0.7 0.3 0.2 0.3    # Human in top-right
```

**Class Definitions:**
```yaml
# classes.yaml
names:
  0: tiger
  1: leopard
  2: elephant
  3: deer
  4: wild_boar
  5: human
  6: vehicle
  7: poacher     # Human in restricted zone
  8: tourist     # Human in tourist zone
```

### Step 3: Train YOLOv8 Model

**Install Ultralytics:**
```bash
pip install ultralytics
```

**Training Script:** `train_wildlife_yolo.py`

```python
from ultralytics import YOLO

# Load pre-trained YOLOv8 model (transfer learning)
model = YOLO('yolov8n.pt')  # nano (fastest, 6MB)
# OR model = YOLO('yolov8s.pt')  # small (22MB, better accuracy)
# OR model = YOLO('yolov8m.pt')  # medium (52MB, best accuracy)

# Train on wildlife dataset
results = model.train(
    data='wildlife.yaml',      # Dataset config
    epochs=100,                # Training iterations
    imgsz=640,                 # Image size
    batch=16,                  # Batch size (adjust for GPU memory)
    device=0,                  # GPU 0 (or 'cpu' for CPU training)
    patience=50,               # Early stopping
    save=True,
    project='tadoba_detection',
    name='yolov8_wildlife_v1',
    pretrained=True,           # Use pre-trained weights
    optimizer='AdamW',
    lr0=0.01,                  # Initial learning rate
    lrf=0.01,                  # Final learning rate
    augment=True,              # Data augmentation
    mosaic=1.0,                # Mosaic augmentation
    mixup=0.1,                 # Mixup augmentation
)

# Evaluate on test set
metrics = model.val()
print(f"mAP50: {metrics.box.map50}")
print(f"mAP50-95: {metrics.box.map}")

# Export to ONNX for deployment
model.export(format='onnx', dynamic=True, simplify=True)
print("Model exported to: tadoba_detection/yolov8_wildlife_v1/weights/best.onnx")
```

**Dataset Config:** `wildlife.yaml`

```yaml
path: /path/to/wildlife-dataset
train: images/train
val: images/val
test: images/test

nc: 9  # number of classes
names:
  0: tiger
  1: leopard
  2: elephant
  3: deer
  4: wild_boar
  5: human
  6: vehicle
  7: poacher
  8: tourist
```

**Training Options:**
```bash
# Free GPU (Google Colab)
# - GPU: Tesla T4 (16GB VRAM)
# - Time: 4-8 hours for 100 epochs
# - Cost: FREE (with time limits)

# Cloud GPU (AWS/GCP)
# - GPU: NVIDIA V100 / A100
# - Time: 2-4 hours
# - Cost: $1-3/hour

# Local GPU (if you have)
# - GPU: RTX 3060+ (12GB+ VRAM)
# - Time: 6-12 hours
# - Cost: Electricity only
```

### Step 4: Deploy YOLOv8 to Node.js

**Option A: ONNX Runtime (Recommended)**

```bash
npm install onnxruntime-node sharp
```

**File:** `server/surveillance/yolo-detection.ts` (NEW)

```typescript
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { DetectionResult, DetectedObject } from './mock-detection';

let session: ort.InferenceSession | null = null;

const CLASS_NAMES = [
  'tiger', 'leopard', 'elephant', 'deer', 'wild_boar',
  'human', 'vehicle', 'poacher', 'tourist'
];

const INPUT_SIZE = 640;

export async function loadYOLOModel() {
  console.log('🐯 Loading Custom YOLOv8 Wildlife Model...');
  session = await ort.InferenceSession.create('./models/yolov8_wildlife.onnx', {
    executionProviders: ['cuda', 'cpu'], // Try GPU first, fallback to CPU
    graphOptimizationLevel: 'all'
  });
  console.log('✅ YOLOv8 model loaded');
}

export async function detectWildlife(imageBuffer: Buffer): Promise<DetectionResult> {
  if (!session) {
    throw new Error('Model not loaded');
  }

  // Preprocess: resize to 640x640, convert to RGB, normalize
  const { data, info } = await sharp(imageBuffer)
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert to float32 and normalize (0-255 -> 0-1)
  const float32Data = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3);
  for (let i = 0; i < data.length; i++) {
    float32Data[i] = data[i] / 255.0;
  }

  // Reshape to NCHW format (batch, channels, height, width)
  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, INPUT_SIZE, INPUT_SIZE]);

  // Run inference
  const startTime = Date.now();
  const results = await session.run({ images: inputTensor });
  const inferenceTime = Date.now() - startTime;
  console.log(`Inference time: ${inferenceTime}ms`);

  // Parse YOLO output
  const output = results.output0.data as Float32Array;
  const detections = parseYOLOOutput(output, info.width, info.height);

  return {
    detections,
    detectionCount: detections.length,
    threatLevel: calculateWildlifeThreat(detections),
    timestamp: new Date().toISOString()
  };
}

function parseYOLOOutput(output: Float32Array, imgWidth: number, imgHeight: number): DetectedObject[] {
  const detections: DetectedObject[] = [];
  
  // YOLOv8 output format: [x, y, w, h, conf, class_scores...]
  const numBoxes = output.length / (4 + 1 + CLASS_NAMES.length);
  
  for (let i = 0; i < numBoxes; i++) {
    const offset = i * (4 + 1 + CLASS_NAMES.length);
    
    const cx = output[offset + 0];
    const cy = output[offset + 1];
    const w = output[offset + 2];
    const h = output[offset + 3];
    const conf = output[offset + 4];
    
    if (conf < 0.5) continue; // Confidence threshold
    
    // Find class with highest score
    let maxClass = 0;
    let maxScore = 0;
    for (let c = 0; c < CLASS_NAMES.length; c++) {
      const score = output[offset + 5 + c];
      if (score > maxScore) {
        maxScore = score;
        maxClass = c;
      }
    }
    
    // Convert to normalized coordinates (0-1)
    const x = (cx - w/2) / INPUT_SIZE;
    const y = (cy - h/2) / INPUT_SIZE;
    const width = w / INPUT_SIZE;
    const height = h / INPUT_SIZE;
    
    detections.push({
      class: CLASS_NAMES[maxClass],
      confidence: conf * maxScore,
      bbox: { x, y, width, height }
    });
  }
  
  // Apply Non-Maximum Suppression (NMS)
  return applyNMS(detections, 0.45);
}

function applyNMS(detections: DetectedObject[], iouThreshold: number): DetectedObject[] {
  // Sort by confidence (highest first)
  detections.sort((a, b) => b.confidence - a.confidence);
  
  const kept: DetectedObject[] = [];
  
  for (const det of detections) {
    let keep = true;
    
    for (const keptDet of kept) {
      const iou = calculateIoU(det.bbox, keptDet.bbox);
      if (iou > iouThreshold) {
        keep = false;
        break;
      }
    }
    
    if (keep) kept.push(det);
  }
  
  return kept;
}

function calculateIoU(box1: any, box2: any): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;
  
  return intersection / union;
}

function calculateWildlifeThreat(detections: DetectedObject[]): 'low' | 'medium' | 'high' | 'critical' {
  const hasTiger = detections.some(d => d.class === 'tiger');
  const hasLeopard = detections.some(d => d.class === 'leopard');
  const hasPoacher = detections.some(d => d.class === 'poacher');
  const hasHuman = detections.some(d => d.class === 'human');
  const hasVehicle = detections.some(d => d.class === 'vehicle');
  
  // CRITICAL: Poacher or human near dangerous animal
  if (hasPoacher || (hasHuman && (hasTiger || hasLeopard))) {
    return 'critical';
  }
  
  // HIGH: Dangerous animal or unauthorized activity
  if (hasTiger || hasLeopard || (hasVehicle && hasHuman)) {
    return 'high';
  }
  
  // MEDIUM: Human or vehicle in protected area
  if (hasHuman || hasVehicle) {
    return 'medium';
  }
  
  // LOW: Only harmless wildlife
  return 'low';
}
```

**Option B: Python Microservice**

If ONNX is complex, run Python service:

**File:** `python-ai/detect.py`

```python
from ultralytics import YOLO
from flask import Flask, request, jsonify
import base64
import io
from PIL import Image
import numpy as np

app = Flask(__name__)
model = YOLO('models/yolov8_wildlife.pt')

@app.route('/detect', methods=['POST'])
def detect():
    try:
        # Parse image from request
        data = request.get_json()
        image_b64 = data['image']
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run detection
        results = model(image, conf=0.5)[0]
        
        # Format response
        detections = []
        for box in results.boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            xywhn = box.xywhn[0].cpu().numpy()
            
            detections.append({
                'class': model.names[cls],
                'confidence': conf,
                'bbox': {
                    'x': float(xywhn[0]),
                    'y': float(xywhn[1]),
                    'width': float(xywhn[2]),
                    'height': float(xywhn[3])
                }
            })
        
        return jsonify({
            'detections': detections,
            'count': len(detections),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
```

**Start Python service:**
```bash
python python-ai/detect.py
```

**Node.js calls Python:**
```typescript
async function detectWildlife(imageBuffer: Buffer): Promise<DetectionResult> {
  const base64 = imageBuffer.toString('base64');
  
  const response = await fetch('http://localhost:5001/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });
  
  const result = await response.json();
  
  return {
    detections: result.detections,
    detectionCount: result.count,
    threatLevel: calculateWildlifeThreat(result.detections),
    timestamp: result.timestamp
  };
}
```

### Step 5: Test Custom Model

```bash
# Test with sample images
node test-wildlife-detection.js

# Expected output:
Detection Results:
✅ tiger detected (confidence: 0.95)
✅ elephant detected (confidence: 0.87)
Threat Level: HIGH
Processing Time: 87ms
```

### Performance Targets
- **Accuracy (mAP50):** >85%
- **Inference Time (GPU):** 50-100ms
- **Inference Time (CPU):** 200-400ms
- **Model Size:** 6-50MB (depending on version)
- **Memory Usage:** 300-500MB

---

## 📹 PHASE 4: IP CAMERA INTEGRATION

**Timeline:** Week 4+ post-hackathon  
**Complexity:** High  
**Hardware:** IP cameras + edge devices

### Architecture

```
┌─────────────────┐
│  IP Camera 1    │──┐
│  (RTSP Stream)  │  │
│  24/7 Recording │  │
└─────────────────┘  │
                      │   ┌─────────────────┐
┌─────────────────┐  ├───│  Edge Device    │
│  IP Camera 2    │──┘   │  (Raspberry Pi  │──┐
│  (RTSP Stream)  │      │   + YOLOv8n)    │  │
└─────────────────┘      └─────────────────┘  │
                                                │
┌─────────────────┐      ┌─────────────────┐  │
│  IP Camera N    │──────│  Edge Device N  │──┤
│  Night Vision   │      │  Local AI       │  │
└─────────────────┘      └─────────────────┘  │
                                                │
                         ┌─────────────────┐  │
                         │  Central Server │◄─┘
                         │  (Node.js API)  │
                         │  + PostgreSQL   │
                         │  + File Storage │
                         └─────────────────┘
                                ▲
                                │
                         ┌──────┴──────┐
                         │  Dashboard  │
                         │  (React UI) │
                         │  Real-time  │
                         └─────────────┘
```

### Hardware Setup

**IP Cameras:**
- **Model:** Hikvision DS-2CD2x43G2 or similar
- **Features:** 4MP, Night vision (IR), RTSP support
- **Cost:** $150-300 each
- **Quantity:** 10-50 cameras

**Edge Devices:**
- **Option A:** Raspberry Pi 4 (8GB RAM) - $75 each
  - CPU-only YOLOv8n
  - 1-2 FPS inference
  - Good for budget deployment
  
- **Option B:** NVIDIA Jetson Nano - $150 each
  - GPU-accelerated YOLOv8s
  - 10-15 FPS inference
  - Better for real-time

- **Option C:** NVIDIA Jetson Orin Nano - $500 each
  - High performance GPU
  - 30+ FPS inference
  - Production-grade

### Implementation

**1. RTSP Stream Reader**

**File:** `server/surveillance/rtsp-camera.ts` (NEW)

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { detectWildlife } from './yolo-detection';
import { storage } from '../storage';
import { broadcastAlert } from '../routes';

export class RTSPCamera {
  private captureInterval: NodeJS.Timeout | null = null;
  
  constructor(
    public id: string,
    public name: string,
    public rtspUrl: string,
    public frameIntervalMs: number = 5000  // Capture every 5 seconds
  ) {}

  async captureFrame(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const buffers: Buffer[] = [];
      
      ffmpeg(this.rtspUrl)
        .outputOptions([
          '-vframes 1',     // Capture 1 frame
          '-f image2pipe',  // Output to pipe
          '-vcodec png'     // PNG format
        ])
        .on('error', (err) => {
          console.error(`Camera ${this.name} capture error:`, err);
          reject(err);
        })
        .on('end', () => resolve(Buffer.concat(buffers)))
        .pipe()
        .on('data', (chunk: Buffer) => buffers.push(chunk));
    });
  }

  async processFrame() {
    try {
      // Capture frame from RTSP stream
      const frameBuffer = await this.captureFrame();
      
      // Run AI detection
      const result = await detectWildlife(frameBuffer);
      
      // Only save if objects detected
      if (result.detectionCount > 0) {
        console.log(`Camera ${this.name}: Detected ${result.detectionCount} objects`);
        
        // Save to database
        const detection = await storage.createDetection({
          camera_id: this.id,
          image_url: `data:image/png;base64,${frameBuffer.toString('base64')}`,
          detected_objects: result.detections,
          detection_count: result.detectionCount,
          threat_level: result.threatLevel
        });
        
        // Broadcast alert if high/critical threat
        if (result.threatLevel === 'high' || result.threatLevel === 'critical') {
          broadcastAlert({
            type: 'detection',
            detectionId: detection.id,
            cameraId: this.id,
            cameraName: this.name,
            ...result
          });
        }
      }
    } catch (error) {
      console.error(`Camera ${this.name} processing error:`, error);
    }
  }

  start() {
    console.log(`📹 Starting camera: ${this.name}`);
    
    // Process first frame immediately
    this.processFrame();
    
    // Then process at intervals
    this.captureInterval = setInterval(() => {
      this.processFrame();
    }, this.frameIntervalMs);
  }

  stop() {
    console.log(`⏹️ Stopping camera: ${this.name}`);
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }
}
```

**2. Camera Manager**

**File:** `server/surveillance/camera-manager.ts` (NEW)

```typescript
import { RTSPCamera } from './rtsp-camera';
import { storage } from '../storage';

export class CameraManager {
  private cameras: Map<string, RTSPCamera> = new Map();

  async initializeAll() {
    console.log('🎥 Initializing all cameras...');
    
    // Get active cameras from database
    const dbCameras = await storage.getAllCameras();
    
    for (const cam of dbCameras) {
      if (cam.status === 'active' && cam.rtsp_url) {
        try {
          const rtspCamera = new RTSPCamera(
            cam.id,
            cam.name,
            cam.rtsp_url,
            5000  // 5 seconds between captures
          );
          
          rtspCamera.start();
          this.cameras.set(cam.id, rtspCamera);
          
          console.log(`✅ Camera ${cam.name} started`);
        } catch (error) {
          console.error(`❌ Failed to start camera ${cam.name}:`, error);
        }
      }
    }
    
    console.log(`✅ ${this.cameras.size} cameras initialized`);
  }

  async addCamera(cameraId: string) {
    const cam = await storage.getCamera(cameraId);
    if (!cam || !cam.rtsp_url) return;
    
    const rtspCamera = new RTSPCamera(cam.id, cam.name, cam.rtsp_url);
    rtspCamera.start();
    this.cameras.set(cam.id, rtspCamera);
  }

  async removeCamera(cameraId: string) {
    const camera = this.cameras.get(cameraId);
    if (camera) {
      camera.stop();
      this.cameras.delete(cameraId);
    }
  }

  stopAll() {
    console.log('⏹️ Stopping all cameras...');
    for (const camera of this.cameras.values()) {
      camera.stop();
    }
    this.cameras.clear();
  }
}

export const cameraManager = new CameraManager();
```

**3. Start Cameras at Server Boot**

**File:** `server/index.ts` (MODIFY)

```typescript
import { cameraManager } from './surveillance/camera-manager';
import { loadYOLOModel } from './surveillance/yolo-detection';

(async () => {
  try {
    console.log('🚀 Starting Tadoba Conservation System...');
    
    // Load AI model
    await loadYOLOModel();
    
    // ... register routes, setup Vite ...
    
    // Start server
    server.listen(port, async () => {
      console.log(`✅ Server listening on port ${port}`);
      
      // Initialize all cameras after server starts
      await cameraManager.initializeAll();
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...');
      cameraManager.stopAll();
      server.close(() => process.exit(0));
    });
    
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();
```

### Edge Processing (Optional)

Run AI on Raspberry Pi at camera location:

**File:** `edge-device/detect.py`

```python
from ultralytics import YOLO
import cv2
import requests
import time

# Load lightweight model
model = YOLO('yolov8n.pt')

# RTSP stream URL
rtsp_url = 'rtsp://admin:password@192.168.1.100:554/stream'

# Central server API
api_url = 'https://tadoba-api.com/api/surveillance/process-frame'
api_token = 'your-jwt-token'

# Open video stream
cap = cv2.VideoCapture(rtsp_url)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to capture frame")
        break
    
    # Run detection
    results = model(frame, conf=0.5)[0]
    
    # Only send to server if objects detected
    if len(results.boxes) > 0:
        print(f"Detected {len(results.boxes)} objects, sending to server...")
        
        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        
        # Send to central server
        files = {'image': ('frame.jpg', buffer.tobytes(), 'image/jpeg')}
        data = {'camera_id': 'camera-1'}
        headers = {'Authorization': f'Bearer {api_token}'}
        
        try:
            response = requests.post(api_url, files=files, data=data, headers=headers)
            print(f"Server response: {response.status_code}")
        except Exception as e:
            print(f"Failed to send to server: {e}")
    
    # Wait 5 seconds before next capture
    time.sleep(5)

cap.release()
```

### Benefits of Edge Processing
- ✅ Reduces bandwidth (only send when detected)
- ✅ Lower latency (local detection)
- ✅ Works offline (store locally if internet down)
- ✅ Privacy (images don't leave site unless needed)

---

## 📊 PERFORMANCE COMPARISON

### Mock Detection (Current)
```
Processing Time: 500-1500ms (simulated)
Throughput: ~1 image/second
CPU Usage: < 1%
Memory: 50MB
Accuracy: N/A (random)
Cost: $0/month
```

### TensorFlow.js + COCO-SSD
```
Processing Time: 100-300ms (CPU), 20-50ms (GPU)
Throughput: 3-10 images/second
CPU Usage: 20-40% (CPU), < 5% (GPU)
Memory: 200MB
Accuracy: 60-70% (general objects)
Cost: $15-30/month (small cloud instance)
```

### Custom YOLOv8n (Wildlife)
```
Processing Time: 50-100ms (GPU), 200-400ms (CPU)
Throughput: 10-20 images/second (GPU)
CPU Usage: < 10% (GPU), 40-60% (CPU)
Memory: 300MB
Accuracy: 85-95% (trained wildlife)
Cost: $50-100/month (GPU instance)
```

### YOLOv8m (Medium Model)
```
Processing Time: 100-200ms (GPU), 800-1200ms (CPU)
Throughput: 5-10 images/second (GPU)
CPU Usage: < 15% (GPU), 80-100% (CPU)
Memory: 500MB
Accuracy: 90-98% (trained wildlife)
Cost: $100-200/month (better GPU)
```

### Real-Time RTSP (10 cameras)
```
Frame Rate: 1 frame every 5 seconds per camera
Total Throughput: 2 frames/second (10 cameras)
Latency: < 1 second (capture to alert)
Bandwidth: 100KB per detection
Storage: 1GB per day (high activity)
Cost: $200-400/month (GPU + storage)
```

---

## 💰 COST BREAKDOWN

### Phase 1: Mock (Current)
```
Development: $0
Infrastructure: $0
Total: $0/month ✅ Perfect for hackathon
```

### Phase 2: TensorFlow.js
```
Development: 2-3 days
Cloud Server: AWS t3.medium (2 vCPU, 4GB RAM)
  - Cost: $0.0416/hour = ~$30/month
Storage: AWS S3 (100GB)
  - Cost: ~$2.30/month
Total: ~$32/month
```

### Phase 3: Custom YOLOv8
```
Training (one-time):
  - Google Colab Pro: $10/month (or free tier)
  - Dataset labeling: 20 hours × $20/hour = $400
  - Total: $410 one-time

Production:
  - AWS EC2 g4dn.xlarge (GPU)
    - 4 vCPU, 16GB RAM, NVIDIA T4
    - Cost: $0.526/hour = $380/month
  - Storage: S3 (500GB)
    - Cost: ~$11/month
  - Total: ~$391/month
```

### Phase 4: IP Cameras (10 cameras)
```
Hardware (one-time):
  - 10× IP cameras: $150/each = $1,500
  - 10× Raspberry Pi 4: $75/each = $750
  - Networking: $500
  - Total: $2,750 one-time

Monthly:
  - Cloud Server: $391/month (from Phase 3)
  - Bandwidth: 1TB/month = $90
  - Storage: 2TB/month = $46
  - Total: ~$527/month
```

### Large Scale (50 cameras)
```
Hardware (one-time):
  - 50× IP cameras: $7,500
  - 50× Edge devices: $3,750-7,500
  - Networking: $2,000
  - Total: $13,250-17,250

Monthly:
  - Kubernetes cluster: 3× GPU nodes = $1,200
  - Storage: 10TB/month = $230
  - Bandwidth: 5TB/month = $450
  - Database: PostgreSQL HA = $300
  - Total: ~$2,180/month
```

---

## 🧪 TESTING STRATEGY

### Mock Detection Tests
```typescript
describe('Mock Detection', () => {
  it('should return valid detection result', () => {
    const result = mockDetection('test.jpg');
    expect(result.detections).toBeDefined();
    expect(result.detectionCount).toBeGreaterThanOrEqual(0);
    expect(['low', 'medium', 'high', 'critical']).toContain(result.threatLevel);
  });

  it('should have realistic confidence scores', () => {
    const result = mockDetection('test.jpg');
    for (const det of result.detections) {
      expect(det.confidence).toBeGreaterThanOrEqual(0.6);
      expect(det.confidence).toBeLessThanOrEqual(0.95);
    }
  });
});
```

### Real AI Tests
```typescript
describe('YOLOv8 Detection', () => {
  beforeAll(async () => {
    await loadYOLOModel();
  });

  it('should detect tiger in test image', async () => {
    const imageBuffer = fs.readFileSync('test-data/tiger.jpg');
    const result = await detectWildlife(imageBuffer);
    
    const hasTiger = result.detections.some(d => d.class === 'tiger');
    expect(hasTiger).toBe(true);
    expect(result.detections[0].confidence).toBeGreaterThan(0.8);
  });

  it('should detect multiple objects', async () => {
    const imageBuffer = fs.readFileSync('test-data/scene.jpg');
    const result = await detectWildlife(imageBuffer);
    expect(result.detections.length).toBeGreaterThan(1);
  });

  it('should process in < 200ms', async () => {
    const imageBuffer = fs.readFileSync('test-data/test.jpg');
    const start = Date.now();
    await detectWildlife(imageBuffer);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
});
```

---

## 📚 RESOURCES

### Documentation
- **YOLOv8:** https://docs.ultralytics.com/
- **TensorFlow.js:** https://www.tensorflow.org/js
- **ONNX Runtime:** https://onnxruntime.ai/
- **FFmpeg:** https://ffmpeg.org/documentation.html

### Datasets
- **LILA BC:** https://lila.science/
- **iNaturalist:** https://www.inaturalist.org/
- **Roboflow Universe:** https://universe.roboflow.com/
- **COCO Dataset:** https://cocodataset.org/

### Tools
- **Roboflow:** https://roboflow.com/ (labeling + augmentation)
- **Ultralytics HUB:** https://hub.ultralytics.com/ (training platform)
- **Google Colab:** https://colab.research.google.com/ (free GPU)

---

## 🎯 QUICK START GUIDE

### For Hackathon (Now)
```bash
# Keep mock detection - it works perfectly!
# Focus on frontend UI, not ML complexity
# Demo with simulated data
# Win with UX and vision, not AI accuracy
✅ CURRENT SYSTEM IS IDEAL FOR HACKATHON
```

### Post-Hackathon Week 1
```bash
# Install TensorFlow.js
npm install @tensorflow/tfjs-node @tensorflow-models/coco-ssd

# Create tensorflow-detection.ts
# Update routes to use real AI
# Test with real images

USE_REAL_AI=true npm run dev
```

### Post-Hackathon Weeks 2-3
```bash
# Collect 1000+ wildlife images
# Label with Roboflow
# Train YOLOv8

python train_wildlife_yolo.py

# Deploy to production
npm install onnxruntime-node sharp
# Create yolo-detection.ts
```

### Post-Hackathon Week 4+
```bash
# Purchase IP cameras
# Set up edge devices
# Deploy YOLOv8 on edge
# Configure RTSP streams
# Monitor and optimize
```

---

## ✅ MIGRATION CHECKLIST

### Phase 1 → 2 (Mock → TensorFlow)
- [ ] Install TensorFlow.js dependencies
- [ ] Create tensorflow-detection.ts
- [ ] Update routes.ts to use real detection
- [ ] Add USE_REAL_AI environment variable
- [ ] Test with sample images
- [ ] Update frontend to show 80 COCO classes
- [ ] Deploy to staging server
- [ ] Performance test (target < 300ms/image)

### Phase 2 → 3 (TensorFlow → Custom YOLO)
- [ ] Collect 1000+ wildlife images
- [ ] Label dataset (tiger, leopard, etc.)
- [ ] Train YOLOv8 model (100 epochs)
- [ ] Evaluate accuracy (target >85% mAP50)
- [ ] Export to ONNX format
- [ ] Install ONNX Runtime
- [ ] Create yolo-detection.ts
- [ ] Test inference speed (target < 200ms)
- [ ] Deploy model to production
- [ ] Update frontend for wildlife classes
- [ ] A/B test vs TensorFlow

### Phase 3 → 4 (Single Image → RTSP Streams)
- [ ] Purchase IP cameras (RTSP support)
- [ ] Set up edge devices (Raspberry Pi/Jetson)
- [ ] Install YOLOv8 on edge devices
- [ ] Install FFmpeg on server
- [ ] Create rtsp-camera.ts
- [ ] Create camera-manager.ts
- [ ] Test continuous detection
- [ ] Set up VPN for secure camera access
- [ ] Deploy to camera locations in Tadoba
- [ ] Monitor bandwidth usage
- [ ] Train conservation staff
- [ ] Set up alerts for rangers

---

## 🚨 CRITICAL REMINDERS

### For Hackathon Judges
1. **Mock AI is SMART** - Shows you understand MVP principles
2. **Focus on UX** - Beautiful UI > Real AI for hackathon
3. **Demo reliability** - Mock never fails, AI can crash
4. **Story matters** - "We'll add real AI post-hackathon" is valid
5. **Time management** - Don't waste 10 hours debugging TensorFlow

### For Production Deployment
1. **Start small** - TensorFlow first, custom YOLO later
2. **Measure metrics** - Track accuracy, speed, cost
3. **Iterate fast** - Deploy quickly, improve continuously
4. **Edge processing** - Reduces costs and improves privacy
5. **Staff training** - Rangers need to understand the system

### Security & Privacy
1. **Delete old images** - Auto-delete after 30 days
2. **Encrypt streams** - Use HTTPS/RTSPS
3. **Access control** - JWT authentication required
4. **Audit logs** - Track who accessed what
5. **Data sovereignty** - Keep sensitive data in India

---

## 📞 FINAL RECOMMENDATIONS

### ✅ DO THIS NOW (Hackathon)
1. Keep mock detection system ✅
2. Focus on frontend UI
3. Create beautiful demo
4. Tell judges about future AI plans
5. Win with vision and execution

### 🔄 DO THIS WEEK 1 (Post-Hackathon)
1. Install TensorFlow.js
2. Test with real detection
3. Deploy to staging
4. Collect user feedback

### 🐯 DO THIS WEEKS 2-3 (Production)
1. Train custom YOLOv8 model
2. Deploy to production
3. Monitor accuracy and speed
4. Improve based on results

### 📹 DO THIS WEEK 4+ (Scale)
1. Integrate IP cameras
2. Deploy edge devices
3. Train staff
4. Launch at Tadoba Reserve

---

*End of Real AI Integration Roadmap*  
*Current mock system is perfect for hackathon. Real AI for production.* 🐯

**Next Steps:** Complete frontend UI with mock data, win hackathon, then migrate to real AI! 🚀
