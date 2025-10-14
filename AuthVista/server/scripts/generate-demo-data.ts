import { storage } from "../storage";
import crypto from "crypto";

interface CameraLocation {
  name: string;
  location: string;
  lat: number;
  lng: number;
  zone: string;
}

// Strategic camera locations across Tadoba Tiger Reserve
const CAMERA_LOCATIONS: CameraLocation[] = [
  { name: "North Gate Checkpoint", location: "Main Entrance North", lat: 20.3524, lng: 79.3420, zone: "Buffer Zone" },
  { name: "Tadoba Lake Waterhole", location: "Tadoba Lake", lat: 20.2880, lng: 79.3544, zone: "Core Zone" },
  { name: "Telia Lake Viewpoint", location: "Telia Lake", lat: 20.2456, lng: 79.3234, zone: "Core Zone" },
  { name: "Jamni Gate Entry", location: "Jamni Gate", lat: 20.2123, lng: 79.2890, zone: "Buffer Zone" },
  { name: "Moharli Safari Route", location: "Moharli Zone", lat: 20.1876, lng: 79.3112, zone: "Buffer Zone" },
  { name: "Kolara Gate Patrol", location: "Kolara Gate", lat: 20.3234, lng: 79.4123, zone: "Buffer Zone" },
  { name: "Panchadhara Waterhole", location: "Panchadhara", lat: 20.2789, lng: 79.3890, zone: "Core Zone" },
  { name: "Navegaon Road Junction", location: "Navegaon", lat: 20.3456, lng: 79.3256, zone: "Buffer Zone" },
  { name: "Junona Gate Watch", location: "Junona Gate", lat: 20.1987, lng: 79.3567, zone: "Buffer Zone" },
  { name: "Agarzari Temple Area", location: "Agarzari", lat: 20.2567, lng: 79.3789, zone: "Core Zone" },
  { name: "Khutwanda Lake Perimeter", location: "Khutwanda Lake", lat: 20.2912, lng: 79.3623, zone: "Core Zone" },
  { name: "Madnapur Border", location: "Madnapur", lat: 20.3678, lng: 79.3945, zone: "Buffer Zone" },
];

// Detection object types with YOLO classes
const OBJECT_TYPES = [
  { class: "person", threat: "medium", description: "Human detected" },
  { class: "person", threat: "high", description: "Multiple persons detected" },
  { class: "weapon", threat: "critical", description: "Weapon (firearm) detected" },
  { class: "car", threat: "low", description: "Vehicle detected" },
  { class: "truck", threat: "medium", description: "Large vehicle detected" },
  { class: "motorcycle", threat: "medium", description: "Motorcycle detected" },
];

// Realistic detection scenarios
const DETECTION_SCENARIOS = [
  {
    objects: [
      { class: "weapon", confidence: 0.92, bbox: [120, 80, 200, 180] },
      { class: "person", confidence: 0.88, bbox: [100, 50, 220, 200] }
    ],
    threat: "critical" as const,
    notes: "Armed individual detected near boundary - immediate alert triggered"
  },
  {
    objects: [
      { class: "person", confidence: 0.85, bbox: [80, 60, 180, 220] },
      { class: "person", confidence: 0.81, bbox: [200, 70, 300, 230] }
    ],
    threat: "high" as const,
    notes: "Multiple persons in restricted zone - potential poaching activity"
  },
  {
    objects: [{ class: "car", confidence: 0.91, bbox: [50, 100, 350, 280] }],
    threat: "low" as const,
    notes: "Authorized vehicle on patrol route"
  },
  {
    objects: [{ class: "person", confidence: 0.78, bbox: [150, 90, 230, 240] }],
    threat: "medium" as const,
    notes: "Single person detected in monitored area"
  },
  {
    objects: [
      { class: "motorcycle", confidence: 0.86, bbox: [100, 120, 220, 200] },
      { class: "person", confidence: 0.83, bbox: [110, 80, 180, 180] }
    ],
    threat: "high" as const,
    notes: "Unauthorized vehicle with rider in buffer zone"
  },
  {
    objects: [{ class: "truck", confidence: 0.89, bbox: [40, 90, 380, 300] }],
    threat: "medium" as const,
    notes: "Heavy vehicle near protected area"
  },
  {
    objects: [
      { class: "person", confidence: 0.94, bbox: [120, 70, 200, 220] },
      { class: "weapon", confidence: 0.87, bbox: [140, 110, 180, 150] }
    ],
    threat: "critical" as const,
    notes: "CRITICAL: Armed poacher detected - rangers dispatched"
  },
  {
    objects: [
      { class: "car", confidence: 0.77, bbox: [60, 110, 320, 270] },
      { class: "person", confidence: 0.81, bbox: [200, 80, 270, 210] }
    ],
    threat: "medium" as const,
    notes: "Vehicle stopped with occupant outside"
  },
];

// Generate realistic timestamps over the past 7 days
function generateTimestamp(daysAgo: number, hourRange: [number, number]): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const hour = Math.floor(Math.random() * (hourRange[1] - hourRange[0]) + hourRange[0]);
  date.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return date;
}

// Generate mock image URL (placeholder for demo)
function generateMockImageUrl(cameraId: string, timestamp: Date): string {
  const dateStr = timestamp.toISOString().split('T')[0];
  const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  return `/uploads/detections/${cameraId}_${dateStr}_${timeStr}.jpg`;
}

// Convert bbox array [x, y, x2, y2] to object {x, y, width, height}
function convertBbox(bbox: number[]) {
  return {
    x: bbox[0],
    y: bbox[1],
    width: bbox[2] - bbox[0],
    height: bbox[3] - bbox[1]
  };
}

export async function generateDemoData() {
  console.log("\n🎬 Starting demo data generation...\n");

  try {
    // Step 1: Create cameras
    console.log("📹 Creating surveillance cameras...");
    const cameras = [];
    
    for (const loc of CAMERA_LOCATIONS) {
      const camera = await storage.createCamera({
        name: loc.name,
        location: loc.location,
        latitude: loc.lat,
        longitude: loc.lng,
        status: Math.random() > 0.15 ? "active" : "inactive", // 85% active
        zone: loc.zone,
      });
      cameras.push(camera);
      console.log(`  ✓ Created camera: ${camera.name} (${camera.zone})`);
    }

    console.log(`\n✅ Created ${cameras.length} cameras\n`);

    // Step 2: Generate detections
    console.log("🔍 Generating detection events...");
    const detections = [];
    const activeCameras = cameras.filter(c => c.status === "active");

    // Generate 100-150 detections over past 7 days
    const detectionCount = 100 + Math.floor(Math.random() * 50);
    
    for (let i = 0; i < detectionCount; i++) {
      const camera = activeCameras[Math.floor(Math.random() * activeCameras.length)];
      const scenario = DETECTION_SCENARIOS[Math.floor(Math.random() * DETECTION_SCENARIOS.length)];
      const daysAgo = Math.floor(Math.random() * 7);
      
      // More detections during night (18:00-06:00) when poaching is common
      const isNightTime = Math.random() > 0.4;
      const hourRange: [number, number] = isNightTime ? [18, 30] : [6, 18]; // 30 wraps to next day
      
      const timestamp = generateTimestamp(daysAgo, hourRange);
      const imageUrl = generateMockImageUrl(camera.id, timestamp);

      // Convert bbox arrays to objects
      const convertedObjects = scenario.objects.map(obj => ({
        ...obj,
        bbox: Array.isArray(obj.bbox) ? convertBbox(obj.bbox) : obj.bbox
      }));

      const detection = await storage.createDetection({
        camera_id: camera.id,
        image_url: imageUrl,
        detected_objects: convertedObjects,
        detection_count: convertedObjects.length,
        threat_level: scenario.threat,
      });

      detections.push(detection);

      // Log critical detections
      if (detection.threat_level === "critical") {
        console.log(`  🚨 CRITICAL: ${camera.name} - ${scenario.notes}`);
      }
    }

    console.log(`\n✅ Generated ${detections.length} detection events`);
    
    // Statistics
    const criticalCount = detections.filter(d => d.threat_level === "critical").length;
    const highCount = detections.filter(d => d.threat_level === "high").length;
    const mediumCount = detections.filter(d => d.threat_level === "medium").length;
    const lowCount = detections.filter(d => d.threat_level === "low").length;

    console.log("\n📊 Detection Summary:");
    console.log(`  🔴 Critical: ${criticalCount} (weapons detected)`);
    console.log(`  🟠 High: ${highCount} (suspicious activity)`);
    console.log(`  🟡 Medium: ${mediumCount} (persons in area)`);
    console.log(`  🟢 Low: ${lowCount} (routine vehicles)`);

    // Recent detections (last 24 hours)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentDetections = detections.filter(d => new Date(d.timestamp) > yesterday);
    console.log(`\n⏰ Recent (24h): ${recentDetections.length} detections`);

    console.log("\n✨ Demo data generation complete!");
    console.log("\n🎯 System Ready for Demo:");
    console.log(`  • ${cameras.length} cameras deployed across Tadoba`);
    console.log(`  • ${detections.length} historical detections (7 days)`);
    console.log(`  • ${criticalCount} critical security threats identified`);
    console.log(`  • Real-time monitoring active\n`);

    return {
      cameras,
      detections,
      stats: {
        totalCameras: cameras.length,
        activeCameras: activeCameras.length,
        totalDetections: detections.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        recent24h: recentDetections.length,
      }
    };

  } catch (error) {
    console.error("\n❌ Error generating demo data:", error);
    throw error;
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  generateDemoData()
    .then(() => {
      console.log("✅ Demo data generation completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Demo data generation failed:", error);
      process.exit(1);
    });
}
