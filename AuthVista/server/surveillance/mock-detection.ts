// Mock detection service for demonstration
// Simulates YOLO model for WILDLIFE CONSERVATION
// TARGET CLASSES: Humans (poachers), Weapons (guns/rifles), Cars (unauthorized vehicles)
// This will be replaced with real YOLOv8 model post-hackathon

export interface DetectedObject {
  class: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectionResult {
  detections: DetectedObject[];
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionCount: number;
  timestamp: Date;
}

// Simulate realistic detection results
// YOLO Model Focus: Humans, Weapons, Cars (Anti-Poaching)
export function mockDetection(imageUrl: string): DetectionResult {
  // Random number of detections (0-3)
  const numDetections = Math.floor(Math.random() * 4);
  
  const possibleObjects = [
    { class: 'person', baseThreat: 'high' },      // Potential poacher/intruder
    { class: 'weapon', baseThreat: 'critical' },  // Gun/rifle - immediate threat
    { class: 'car', baseThreat: 'medium' },       // Unauthorized vehicle
    { class: 'truck', baseThreat: 'medium' },     // Large vehicle
    { class: 'motorcycle', baseThreat: 'low' },
    { class: 'bicycle', baseThreat: 'low' },
  ];

  const detections: DetectedObject[] = [];
  let maxThreat: 'low' | 'medium' | 'high' | 'critical' = 'low';

  for (let i = 0; i < numDetections; i++) {
    const obj = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

    detections.push({
      class: obj.class,
      confidence: parseFloat(confidence.toFixed(2)),
      bbox: {
        x: Math.floor(Math.random() * 400),
        y: Math.floor(Math.random() * 300),
        width: Math.floor(50 + Math.random() * 150),
        height: Math.floor(50 + Math.random() * 150),
      },
    });

    // Update threat level
    if (obj.class === 'person') {
      maxThreat = numDetections > 1 ? 'critical' : 'high';
    } else if (obj.class === 'car' || obj.class === 'truck') {
      if (maxThreat === 'low') maxThreat = 'medium';
    }
  }

  return {
    detections,
    threatLevel: maxThreat,
    detectionCount: numDetections,
    timestamp: new Date(),
  };
}

// Simulate processing delay (realistic for demo)
export async function processFrame(imageUrl: string): Promise<DetectionResult> {
  // Simulate processing time (500-1500ms)
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  return mockDetection(imageUrl);
}
