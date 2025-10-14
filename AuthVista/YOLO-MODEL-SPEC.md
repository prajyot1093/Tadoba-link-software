# 🎯 YOLO MODEL SPECIFICATION - Tadoba Conservation Surveillance

**Project:** Tadoba Tiger Conservation AI Surveillance System  
**Model:** Pretrained YOLO (You Only Look Once)  
**Purpose:** Real-time wildlife conservation and anti-poaching surveillance

---

## 🎯 TARGET DETECTION CLASSES

### Primary Classes (Conservation Focus)

| Class | Priority | Threat Level | Use Case |
|-------|----------|--------------|----------|
| **person** | HIGH | Medium-Critical | Detect poachers, intruders, unauthorized personnel |
| **weapon** | CRITICAL | Critical | Detect guns, rifles, hunting equipment - immediate alert |
| **car** | MEDIUM | Low-High | Detect unauthorized vehicles in restricted zones |
| **truck** | MEDIUM | Low-High | Detect large vehicles (potential smuggling) |
| **motorcycle** | LOW | Low-Medium | Detect small vehicles on forest trails |

---

## 🚨 THREAT LEVEL CALCULATION

### Logic Rules (Implemented in Backend)

```typescript
CRITICAL Threat:
  - Weapon detected (ANY weapon = immediate alert)
  - Trigger: Armed poacher/intruder
  
HIGH Threat:
  - Person + Vehicle detected together
  - Trigger: Potential poaching activity (arrival/escape)
  
MEDIUM Threat:
  - Person detected alone
  - Trigger: Unauthorized entry, needs investigation
  
LOW Threat:
  - Only vehicle detected
  - Multiple persons (tourists/staff)
  - Trigger: Normal activity monitoring
```

---

## 📊 MODEL SPECIFICATIONS

### Current Implementation (Mock for Hackathon)

**File:** `server/surveillance/mock-detection.ts`

**Behavior:**
- Randomly generates 0-3 detections per image
- Classes: person, weapon, car, truck, motorcycle
- Confidence: 60-95% (realistic YOLO range)
- Bounding boxes: Randomized coordinates (0-1 normalized)
- Processing delay: 500-1500ms (simulates real inference time)

**Threat Logic:**
```javascript
if (weapon detected) → CRITICAL
else if (person + vehicle) → HIGH
else if (person alone) → MEDIUM
else → LOW
```

---

## 🔄 REAL YOLO INTEGRATION (Post-Hackathon)

### Model Options

#### Option 1: YOLOv8 (Recommended)
**Provider:** Ultralytics  
**Framework:** ONNX Runtime or TensorFlow.js  
**Advantages:**
- Latest YOLO architecture
- Best accuracy/speed balance
- Easy to deploy on edge devices
- Custom training support

**Implementation:**
```typescript
import * as ort from 'onnxruntime-node';

async function runYOLOv8(imageBuffer: Buffer) {
  const session = await ort.InferenceSession.create('yolov8n-custom.onnx');
  const preprocessed = preprocessImage(imageBuffer); // 640x640, normalized
  const results = await session.run({
    images: new ort.Tensor('float32', preprocessed, [1, 3, 640, 640])
  });
  return postprocessResults(results.output0);
}
```

#### Option 2: YOLOv5
**Provider:** Ultralytics  
**Framework:** TensorFlow.js or PyTorch (via API)  
**Advantages:**
- Mature, well-tested
- Extensive documentation
- Good community support

#### Option 3: YOLO-NAS
**Provider:** Deci AI  
**Advantages:**
- State-of-the-art accuracy
- Neural Architecture Search optimized
- Better for edge deployment

---

## 🎓 CUSTOM TRAINING (Future Enhancement)

### Dataset Requirements

**Size:** 10,000+ labeled images minimum

**Classes:**
- Person (poacher) - 3,000 images
- Weapon (rifle, gun) - 2,000 images
- Car - 2,000 images
- Truck - 1,500 images
- Motorcycle - 1,500 images

**Annotation Format:** YOLO format (.txt files)
```
class_id x_center y_center width height
0 0.5 0.5 0.3 0.4
```

**Tools:**
- Roboflow (annotation + augmentation)
- LabelImg (manual annotation)
- CVAT (Computer Vision Annotation Tool)

### Training Pipeline

1. **Data Collection:**
   - Camera trap images from Tadoba reserve
   - Public datasets (COCO, Open Images)
   - Synthetic data augmentation

2. **Preprocessing:**
   - Resize to 640x640
   - Normalize RGB values
   - Apply augmentations (flip, rotate, brightness)

3. **Training:**
   - Platform: Google Colab Pro (GPU) or AWS SageMaker
   - Epochs: 100-300
   - Batch size: 16-32
   - Learning rate: 0.001 (with cosine decay)

4. **Export:**
   - ONNX format for Node.js deployment
   - TensorFlow.js format for browser inference
   - TFLite for mobile/edge devices

---

## 🚀 DEPLOYMENT ARCHITECTURE

### Phase 1: Current (Mock Detection)
```
Camera Image → Express API → Mock Detection Service → Database
                             ↓
                         Random results (person, weapon, car)
```

### Phase 2: Server-Side YOLO (Recommended)
```
Camera Image → Express API → ONNX Runtime → YOLOv8 Model → Database
                             ↓
                         GPU acceleration (CUDA)
                         Real-time inference (50-100ms)
```

### Phase 3: Edge Deployment (Future)
```
Camera → Raspberry Pi 4 + Coral TPU → YOLOv8 Lite → Local Processing
         ↓
         Send detections to cloud (WiFi/4G)
         ↓
         Express API → Database → Dashboard
```

### Phase 4: Hybrid (Production)
```
Camera → Edge Device (preliminary filtering) → Cloud (detailed analysis)
         ↓                                      ↓
         Low threat: Local storage              High threat: Immediate alert
         High threat: Upload to cloud           Critical: SMS/Email/Siren
```

---

## 📈 PERFORMANCE TARGETS

### Inference Speed
- **Mock (Current):** 500-1500ms (simulated)
- **YOLOv8n (CPU):** 200-400ms per image
- **YOLOv8n (GPU):** 20-50ms per image
- **YOLOv8n (Coral TPU):** 10-30ms per image

### Accuracy (mAP@0.5)
- **Generic COCO model:** ~50% (not optimal for conservation)
- **Custom trained model:** 80-90% (conservation-specific)
- **Fine-tuned model:** 85-95% (with Tadoba-specific data)

### Throughput
- **Single camera:** 1 frame per 2 seconds (sufficient for wildlife)
- **10 cameras:** Parallel processing, 10 FPS total
- **Batch processing:** Process multiple images simultaneously

---

## 🛠️ INTEGRATION STEPS (After Hackathon)

### Step 1: Install Dependencies (1 hour)
```bash
npm install onnxruntime-node
npm install sharp  # Image preprocessing
npm install @tensorflow/tfjs-node  # Alternative to ONNX
```

### Step 2: Download Pretrained Model (30 min)
```bash
# YOLOv8n ONNX model (6 MB)
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx

# Or custom trained model
wget https://your-storage/yolov8-conservation.onnx
```

### Step 3: Replace Mock Detection (2 hours)
- Update `server/surveillance/mock-detection.ts` → `yolo-detection.ts`
- Implement `preprocessImage()` function (resize, normalize)
- Implement `runInference()` using ONNX Runtime
- Implement `postprocessResults()` (NMS, filtering)

### Step 4: Add GPU Support (1 hour)
```typescript
const session = await ort.InferenceSession.create('model.onnx', {
  executionProviders: ['cuda', 'cpu'],  // Try GPU first
  graphOptimizationLevel: 'all'
});
```

### Step 5: Test & Optimize (3 hours)
- Test with real camera images from Tadoba
- Benchmark inference speed
- Tune confidence threshold (0.3-0.7)
- Implement batching for multiple images

### Step 6: Deploy (2 hours)
- Update API endpoints
- Add model file to deployment
- Configure environment variables
- Monitor performance

**Total Time:** ~10 hours for complete real YOLO integration

---

## 💰 COST ESTIMATION

### Cloud Inference (AWS/Azure/GCP)
- **CPU Instance:** $0.05 per hour (t3.medium)
- **GPU Instance:** $0.90 per hour (g4dn.xlarge)
- **Monthly Cost (24/7):** $36 CPU or $650 GPU

### Edge Deployment (One-time)
- **Raspberry Pi 4 (8GB):** $75 per camera
- **Coral USB Accelerator:** $60 per camera
- **Camera Module:** $50 per camera
- **Total per site:** $185 + installation

### Hybrid Approach (Recommended)
- Edge devices for 10 cameras: $1,850
- Cloud backup (CPU instance): $36/month
- Total first year: ~$2,300

---

## 🎯 HACKATHON vs PRODUCTION

### Current (Hackathon Demo)
✅ Mock detection (sufficient for demo)  
✅ Realistic output format  
✅ Threat level logic implemented  
✅ Fast development (no model training)  
✅ No GPU required  

### Production (Real Conservation)
⏳ Real YOLO model required  
⏳ Custom training on Tadoba data  
⏳ GPU/TPU acceleration  
⏳ Edge deployment for reliability  
⏳ Regular model updates  

---

## 📞 NEXT STEPS

### For Hackathon (Current Focus)
1. ✅ Keep mock detection as-is
2. ✅ Build complete UI showing detections
3. ✅ Demonstrate threat level system
4. ✅ Show bounding boxes on images
5. ✅ Prove concept works end-to-end

### Post-Hackathon (Real Deployment)
1. Collect 10,000+ images from Tadoba cameras
2. Annotate dataset with Roboflow
3. Train custom YOLOv8 model on Google Colab
4. Export to ONNX format
5. Integrate with existing backend
6. Deploy to edge devices (Raspberry Pi)
7. Monitor and retrain monthly

---

## 🏆 COMPETITIVE ADVANTAGE

**Why YOLO for Wildlife Conservation?**

✅ **Real-time:** Process images in < 50ms  
✅ **Accurate:** 85-95% detection rate  
✅ **Edge-ready:** Runs on Raspberry Pi  
✅ **Custom classes:** Trained for conservation  
✅ **Proven:** Used by WWF, Wildlife Conservation Society  

**Similar Projects:**
- Wildbook (Microsoft AI for Earth)
- TrailGuard AI (Resolve + Intel)
- Protection Assistant for Wildlife Security (PAWS)

---

*This document serves as the technical specification for integrating real YOLO detection into the Tadoba Conservation System after the hackathon demonstration.*
