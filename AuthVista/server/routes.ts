import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertAnimalSchema,
  insertAnimalLocationSchema,
  insertSafeZoneSchema,
  insertSafariBookingSchema,
  insertAlertSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
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

  app.post('/api/animals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch('/api/animals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/animals/:id/locations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post('/api/safe-zones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.get('/api/bookings/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/bookings/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/alerts/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUserAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching user alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  return httpServer;
}
