import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import multer from "multer";
import { processFrame } from "./surveillance/mock-detection";
import { 
  isAuthenticated, 
  generateToken, 
  hashPassword, 
  comparePassword,
  getUserId,
  type AuthRequest 
} from "./auth/jwt-auth";
import { 
  insertAnimalSchema,
  insertAnimalLocationSchema,
  insertSafeZoneSchema,
  insertSafariBookingSchema,
  insertAlertSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes - Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, area } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'local',
        area,
      });

      // Generate token
      const token = generateToken({ userId: user.id, role: user.role as 'department' | 'local' });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Auth routes - Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken({ userId: user.id, role: user.role as 'department' | 'local' });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Animal routes
  app.get('/api/animals', isAuthenticated, async (req, res) => {
    try {
      const animals = await storage.getAllAnimals();
      res.json(animals);
    } catch (error) {
      console.error("Error fetching animals:", error);
      res.status(500).json({ message: "Failed to fetch animals" });
    }
  });

  app.get('/api/animals/:id', isAuthenticated, async (req, res) => {
    try {
      const animal = await storage.getAnimal(req.params.id);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error) {
      console.error("Error fetching animal:", error);
      res.status(500).json({ message: "Failed to fetch animal" });
    }
  });

  app.post('/api/animals', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can add animals" });
      }

      const data = insertAnimalSchema.parse(req.body);
      const animal = await storage.createAnimal(data);
      
      // Create location record if coordinates provided
      if (data.lastSeenLat && data.lastSeenLng) {
        await storage.createAnimalLocation({
          animalId: animal.id,
          latitude: data.lastSeenLat,
          longitude: data.lastSeenLng,
          location: data.lastSeenLocation,
          recordedBy: userId,
        });
      }

      res.json(animal);
    } catch (error: any) {
      console.error("Error creating animal:", error);
      res.status(400).json({ message: error.message || "Failed to create animal" });
    }
  });

  app.patch('/api/animals/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can update animals" });
      }

      const animal = await storage.updateAnimal(req.params.id, req.body);
      if (!animal) {
        return res.status(404).json({ message: "Animal not found" });
      }
      res.json(animal);
    } catch (error: any) {
      console.error("Error updating animal:", error);
      res.status(400).json({ message: error.message || "Failed to update animal" });
    }
  });

  // Animal location routes
  app.get('/api/animals/:id/locations', isAuthenticated, async (req, res) => {
    try {
      const locations = await storage.getAnimalLocations(req.params.id);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post('/api/animals/:id/locations', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can add locations" });
      }

      const data = insertAnimalLocationSchema.parse({
        ...req.body,
        animalId: req.params.id,
        recordedBy: userId,
      });
      const location = await storage.createAnimalLocation(data);
      
      // Update animal's last seen info
      await storage.updateAnimal(req.params.id, {
        lastSeenLat: data.latitude,
        lastSeenLng: data.longitude,
        lastSeenLocation: data.location,
      });

      res.json(location);
    } catch (error: any) {
      console.error("Error creating location:", error);
      res.status(400).json({ message: error.message || "Failed to create location" });
    }
  });

  // Safe zone routes
  app.get('/api/safe-zones', isAuthenticated, async (req, res) => {
    try {
      const zones = await storage.getAllSafeZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching safe zones:", error);
      res.status(500).json({ message: "Failed to fetch safe zones" });
    }
  });

  app.post('/api/safe-zones', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can create safe zones" });
      }

      const data = insertSafeZoneSchema.parse(req.body);
      const zone = await storage.createSafeZone(data);
      res.json(zone);
    } catch (error: any) {
      console.error("Error creating safe zone:", error);
      res.status(400).json({ message: error.message || "Failed to create safe zone" });
    }
  });

  // Safari booking routes
  app.get('/api/bookings/all', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can view all bookings" });
      }

      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/my', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const data = insertSafariBookingSchema.parse({
        ...req.body,
        userId,
      });
      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  // Alert routes
  app.get('/api/alerts/recent', isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get('/api/alerts/my', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const alerts = await storage.getUserAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching user alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'department') {
        return res.status(403).json({ message: "Only department officials can create alerts" });
      }

      const data = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(data);
      
      // Broadcast alert via WebSocket
      broadcastAlert(alert);
      
      res.json(alert);
    } catch (error: any) {
      console.error("Error creating alert:", error);
      res.status(400).json({ message: error.message || "Failed to create alert" });
    }
  });

  app.patch('/api/alerts/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markAlertAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time alerts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected. Total clients:', clients.size);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for alerts
  function broadcastAlert(alert: any) {
    const message = JSON.stringify({ type: 'alert', data: alert });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Store broadcast function globally for use in routes
  (global as any).broadcastAlert = broadcastAlert;

  // ============ SURVEILLANCE ROUTES ============
  
  // Get all cameras
  app.get('/api/surveillance/cameras', isAuthenticated, async (req, res) => {
    try {
      const cameras = await storage.getAllCameras();
      res.json(cameras);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({ message: 'Failed to fetch cameras' });
    }
  });

  // Register new camera
  app.post('/api/surveillance/cameras', isAuthenticated, async (req, res) => {
    try {
      const { name, location, latitude, longitude, zone } = req.body;
      
      if (!name || !location || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const camera = await storage.createCamera({
        name,
        location,
        latitude,
        longitude,
        zone,
        status: 'active',
      });

      res.status(201).json(camera);
    } catch (error) {
      console.error('Error creating camera:', error);
      res.status(500).json({ message: 'Failed to create camera' });
    }
  });

  // Process image frame for detection
  app.post('/api/surveillance/process-frame', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const { cameraId } = req.body;
      const imageFile = req.file;

      if (!cameraId || !imageFile) {
        return res.status(400).json({ message: 'Camera ID and image are required' });
      }

      // Convert buffer to base64 data URL
      const imageUrl = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;

      // Process frame with mock detection
      const result = await processFrame(imageUrl);

      // Save detection to database
      const detection = await storage.createDetection({
        camera_id: cameraId,
        image_url: imageUrl,
        detected_objects: result.detections,
        detection_count: result.detectionCount,
        threat_level: result.threatLevel,
      });

      // Broadcast alert if threat detected
      if (result.detectionCount > 0) {
        broadcastAlert({
          type: 'detection',
          detectionId: detection.id,
          cameraId,
          threatLevel: result.threatLevel,
          count: result.detectionCount,
          timestamp: result.timestamp,
        });
      }

      res.json({
        detection,
        result,
      });
    } catch (error) {
      console.error('Error processing frame:', error);
      res.status(500).json({ message: 'Failed to process frame' });
    }
  });

  // Get recent detections
  app.get('/api/surveillance/detections', isAuthenticated, async (req, res) => {
    try {
      const { cameraId, limit } = req.query;
      const detections = await storage.getDetections({
        camera_id: cameraId as string,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.json(detections);
    } catch (error) {
      console.error('Error fetching detections:', error);
      res.status(500).json({ message: 'Failed to fetch detections' });
    }
  });

  // Get single detection
  app.get('/api/surveillance/detections/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const detection = await storage.getDetection(id);
      
      if (!detection) {
        return res.status(404).json({ message: 'Detection not found' });
      }

      res.json(detection);
    } catch (error) {
      console.error('Error fetching detection:', error);
      res.status(500).json({ message: 'Failed to fetch detection' });
    }
  });

  // Demo data generation endpoint (for hackathon)
  app.post('/api/demo/generate', isAuthenticated, async (req, res) => {
    try {
      const { generateDemoData } = await import('./scripts/generate-demo-data');
      const result = await generateDemoData();
      res.json({
        message: 'Demo data generated successfully',
        stats: result.stats
      });
    } catch (error) {
      console.error('Error generating demo data:', error);
      res.status(500).json({ message: 'Failed to generate demo data' });
    }
  });

  // Settings routes
  const settingsRouter = await import('./routes/settings');
  app.use('/api/settings', settingsRouter.default);

  return httpServer;
}
