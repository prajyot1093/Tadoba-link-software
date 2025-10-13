# 🎯 PHASE 2: SURVEILLANCE FEATURE - ACTION PLAN
**Start Time:** Ready to begin  
**Estimated Duration:** 6-8 hours  
**Target Commits:** 10 commits (#9-#18)

---

## 🚀 QUICK START COMMANDS

```bash
# Navigate to project
cd "C:\Users\prajy\OneDrive\Desktop\Tadoba-link software\AuthVista"

# Install TensorFlow.js
npm install @tensorflow/tfjs-node @tensorflow-models/coco-ssd multer

# Create directories
mkdir server\surveillance
mkdir client\src\pages\surveillance  
mkdir client\src\components\surveillance

# Commit
git add .
git commit -m "chore: install TensorFlow.js and create surveillance structure"
```

---

## 📋 10-COMMIT ROADMAP

### Commit #9: Database Schema (15 min)
**Files:** `shared/schema.ts`, `server/storage.ts`

Add cameras and detections tables:
```typescript
export const cameras = pgTable("cameras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 200 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: varchar("status", { length: 20 }).default('active'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const detections = pgTable("detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cameraId: varchar("camera_id").references(() => cameras.id),
  detectedAt: timestamp("detected_at").defaultNow(),
  objectType: varchar("object_type", { length: 50 }),
  confidence: real("confidence"),
  imageUrl: varchar("image_url"),
  boundingBox: jsonb("bounding_box"),
});
```

### Commit #10: Detection Service (45 min)
**Files:** `server/surveillance/detection-service.ts`

Create COCO-SSD wrapper:
```typescript
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

export class DetectionService {
  private model: cocoSsd.ObjectDetection | null = null;

  async loadModel() {
    if (!this.model) {
      this.model = await cocoSsd.load();
    }
    return this.model;
  }

  async detectObjects(imagePath: string) {
    const model = await this.loadModel();
    const imageBuffer = fs.readFileSync(imagePath);
    const tfimage = tf.node.decodeImage(imageBuffer);
    const predictions = await model.detect(tfimage as any);
    
    // Filter for humans and vehicles
    const threats = predictions.filter(p => 
      ['person', 'car', 'truck', 'motorcycle', 'bus'].includes(p.class)
    );
    
    tfimage.dispose();
    return threats;
  }
}
```

### Commit #11: API Routes (30 min)
**Files:** `server/surveillance/routes.ts`, `server/routes.ts`

Add surveillance endpoints.

### Commit #12: Image Upload (30 min)
**Files:** Update routes with multer for file uploads

### Commit #13: Alert System (30 min)
**Files:** Integrate WebSocket alerts

### Commit #14: Frontend Dashboard (1 hour)
**Files:** `client/src/pages/surveillance/index.tsx`

### Commit #15: Camera Manager (45 min)
**Files:** `client/src/components/surveillance/camera-manager.tsx`

### Commit #16: Detection Map (45 min)
**Files:** `client/src/components/surveillance/detection-map.tsx`

### Commit #17: Analytics (1 hour)
**Files:** `client/src/components/surveillance/analytics.tsx`

### Commit #18: Integration (30 min)
**Files:** Update navigation and dashboard

---

## 🎯 MINIMAL VIABLE VERSION (4 hours)

If time is tight, implement just these:

### Must-Have:
1. Image upload endpoint
2. COCO-SSD detection
3. Display detection results
4. Show on map

### Skip:
- Real-time camera feeds
- Advanced analytics
- Multiple cameras
- Export functionality

---

## 🆘 TROUBLESHOOTING GUIDE

### If TensorFlow.js fails:
```bash
# Fallback: Use API
npm install axios
# Use Roboflow API instead
```

### If detection is slow:
```typescript
// Use smaller model
const model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
```

### If memory issues:
```typescript
// Dispose tensors properly
tf.dispose(tensor);
tf.engine().startScope();
// ... your code
tf.engine().endScope();
```

---

## ✅ READY?

Reply with:
- **"Start Phase 2"** → I'll begin implementing
- **"Show me code first"** → I'll provide full code
- **"Let me try alone"** → Work independently

**Current Status:** Ready to build surveillance! 🚀
