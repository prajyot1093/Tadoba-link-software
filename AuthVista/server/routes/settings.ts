import { Router } from "express";
import { isAuthenticated } from "../auth/jwt-auth";
import type { Request, Response } from "express";

const router = Router();

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  dataType: string;
  description?: string;
}

// Mock settings storage (in-memory for hackathon demo)
const mockSettings: SystemSetting[] = [
  // Camera settings
  { id: "1", category: "camera", key: "detectionConfidence", value: "0.7", dataType: "number", description: "YOLO detection confidence threshold" },
  { id: "2", category: "camera", key: "alertThreshold", value: "high", dataType: "string", description: "Minimum alert level" },
  { id: "3", category: "camera", key: "refreshInterval", value: "30", dataType: "number", description: "Camera refresh interval in seconds" },
  { id: "4", category: "camera", key: "storageLimit", value: "1000", dataType: "number", description: "Max detections to store" },
  // Notification settings
  { id: "5", category: "notifications", key: "enableSound", value: "true", dataType: "boolean", description: "Enable sound alerts" },
  { id: "6", category: "notifications", key: "enableBrowser", value: "true", dataType: "boolean", description: "Enable browser notifications" },
  { id: "7", category: "notifications", key: "criticalOnly", value: "false", dataType: "boolean", description: "Only critical alerts" },
  { id: "8", category: "notifications", key: "quietHours", value: "false", dataType: "boolean", description: "Enable quiet hours" },
  { id: "9", category: "notifications", key: "quietStart", value: "22:00", dataType: "string", description: "Quiet hours start time" },
  { id: "10", category: "notifications", key: "quietEnd", value: "06:00", dataType: "string", description: "Quiet hours end time" },
  // Display settings
  { id: "11", category: "display", key: "theme", value: "dark", dataType: "string", description: "UI theme" },
  { id: "12", category: "display", key: "mapZoom", value: "12", dataType: "number", description: "Default map zoom level" },
  { id: "13", category: "display", key: "gridColumns", value: "3", dataType: "string", description: "Camera grid columns" },
  { id: "14", category: "display", key: "showTimestamps", value: "true", dataType: "boolean", description: "Show detection timestamps" },
  { id: "15", category: "display", key: "autoRefresh", value: "true", dataType: "boolean", description: "Auto refresh data" },
];

// Get all settings
router.get("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    res.json(mockSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

// Update settings
router.put("/", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { settings } = req.body as { settings: Partial<SystemSetting>[] };

    if (!Array.isArray(settings) || settings.length === 0) {
      res.status(400).json({ message: "Settings array is required" });
      return;
    }

    // Update mock settings
    settings.forEach(setting => {
      if (!setting.category || !setting.key || setting.value === undefined) {
        return;
      }

      const index = mockSettings.findIndex(
        s => s.category === setting.category && s.key === setting.key
      );

      if (index !== -1) {
        mockSettings[index].value = setting.value;
        if (setting.dataType) {
          mockSettings[index].dataType = setting.dataType;
        }
      } else {
        // Add new setting
        mockSettings.push({
          id: crypto.randomUUID(),
          category: setting.category!,
          key: setting.key!,
          value: setting.value,
          dataType: setting.dataType || "string",
          description: setting.description
        });
      }
    });

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// Get setting by category
router.get("/category/:category", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const settings = mockSettings.filter(s => s.category === category);
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

export default router;
