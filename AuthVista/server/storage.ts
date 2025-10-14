import {
  users,
  animals,
  animalLocations,
  safeZones,
  safariBookings,
  alerts,
  type User,
  type UpsertUser,
  type Animal,
  type InsertAnimal,
  type AnimalLocation,
  type InsertAnimalLocation,
  type SafeZone,
  type InsertSafeZone,
  type SafariBooking,
  type InsertSafariBooking,
  type Alert,
  type InsertAlert,
} from "@shared/schema";
import { db, sqlite } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// Surveillance types
export interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance';
  zone?: string;
  created_at: string;
  updated_at: string;
}

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

export interface Detection {
  id: string;
  camera_id: string;
  image_url: string;
  detected_objects: DetectedObject[];
  detection_count: number;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface IStorage {
  // User operations - JWT authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Animal operations
  getAllAnimals(): Promise<Animal[]>;
  getAnimal(id: string): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: string, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  
  // Animal location operations
  createAnimalLocation(location: InsertAnimalLocation): Promise<AnimalLocation>;
  getAnimalLocations(animalId: string): Promise<AnimalLocation[]>;
  
  // Safe zone operations
  getAllSafeZones(): Promise<SafeZone[]>;
  createSafeZone(zone: InsertSafeZone): Promise<SafeZone>;
  
  // Safari booking operations
  getAllBookings(): Promise<SafariBooking[]>;
  getUserBookings(userId: string): Promise<SafariBooking[]>;
  createBooking(booking: InsertSafariBooking): Promise<SafariBooking>;
  
  // Alert operations
  getAllAlerts(): Promise<Alert[]>;
  getUserAlerts(userId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  
  // Surveillance operations
  getAllCameras(): Promise<any[]>;
  createCamera(camera: any): Promise<any>;
  createDetection(detection: any): Promise<any>;
  getDetections(params: { cameraId?: string; limit: number }): Promise<any[]>;
  getDetection(id: string): Promise<any | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const userWithId = {
      ...userData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const [user] = await db.insert(users).values(userWithId).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // For SQLite, we use manual upsert logic
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      // Update existing user using raw SQL
      const stmt = sqlite.prepare(`
        UPDATE users 
        SET first_name = ?, last_name = ?, profile_image_url = ?, updated_at = ?
        WHERE email = ?
      `);
      stmt.run(
        userData.firstName || existingUser.firstName,
        userData.lastName || existingUser.lastName,
        userData.profileImageUrl || existingUser.profileImageUrl,
        new Date().toISOString(),
        userData.email
      );
      return await this.getUserByEmail(userData.email) as User;
    } else {
      // Create new user
      return await this.createUser(userData);
    }
  }

  // Animal operations
  async getAllAnimals(): Promise<Animal[]> {
    return await db.select().from(animals).orderBy(desc(animals.createdAt));
  }

  async getAnimal(id: string): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.id, id));
    return animal;
  }

  async createAnimal(animalData: InsertAnimal): Promise<Animal> {
    const now = new Date();
    const animalWithId = {
      ...animalData,
      id: uuidv4(),
      lastSeenAt: animalData.lastSeenLat && animalData.lastSeenLng ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };
    const [animal] = await db.insert(animals).values(animalWithId).returning();
    return animal;
  }

  async updateAnimal(id: string, animalData: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const [animal] = await db
      .update(animals)
      .set({
        ...animalData,
        lastSeenAt: animalData.lastSeenLat && animalData.lastSeenLng ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, id))
      .returning();
    return animal;
  }

  // Animal location operations
  async createAnimalLocation(locationData: InsertAnimalLocation): Promise<AnimalLocation> {
    const locationWithId = {
      ...locationData,
      id: uuidv4(),
      recordedAt: new Date(),
    };
    const [location] = await db.insert(animalLocations).values(locationWithId).returning();
    return location;
  }

  async getAnimalLocations(animalId: string): Promise<AnimalLocation[]> {
    return await db
      .select()
      .from(animalLocations)
      .where(eq(animalLocations.animalId, animalId))
      .orderBy(desc(animalLocations.recordedAt));
  }

  // Safe zone operations
  async getAllSafeZones(): Promise<SafeZone[]> {
    return await db.select().from(safeZones).where(eq(safeZones.isActive, true));
  }

  async createSafeZone(zoneData: InsertSafeZone): Promise<SafeZone> {
    const zoneWithId = {
      ...zoneData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    const [zone] = await db.insert(safeZones).values(zoneWithId).returning();
    return zone;
  }

  // Safari booking operations
  async getAllBookings(): Promise<SafariBooking[]> {
    return await db.select().from(safariBookings).orderBy(desc(safariBookings.createdAt));
  }

  async getUserBookings(userId: string): Promise<SafariBooking[]> {
    return await db
      .select()
      .from(safariBookings)
      .where(eq(safariBookings.userId, userId))
      .orderBy(desc(safariBookings.createdAt));
  }

  async createBooking(bookingData: InsertSafariBooking): Promise<SafariBooking> {
    const bookingWithId = {
      ...bookingData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    const [booking] = await db.insert(safariBookings).values(bookingWithId).returning();
    return booking;
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt)).limit(50);
  }

  async getUserAlerts(userId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt))
      .limit(20);
  }

  async createAlert(alertData: InsertAlert): Promise<Alert> {
    const alertWithId = {
      ...alertData,
      id: uuidv4(),
      createdAt: new Date(),
    };
    const [alert] = await db.insert(alerts).values(alertWithId).returning();
    return alert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }

  // Surveillance operations
  async getAllCameras(): Promise<Camera[]> {
    const stmt = sqlite.prepare(`
      SELECT * FROM cameras ORDER BY created_at DESC
    `);
    return stmt.all() as Camera[];
  }

  async createCamera(camera: Omit<Camera, 'id' | 'created_at' | 'updated_at'>): Promise<Camera> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const stmt = sqlite.prepare(`
      INSERT INTO cameras (id, name, location, latitude, longitude, status, zone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, camera.name, camera.location, camera.latitude, camera.longitude, camera.status, camera.zone, now, now);
    
    return { ...camera, id, created_at: now, updated_at: now } as Camera;
  }

  async createDetection(detection: Omit<Detection, 'id' | 'timestamp'>): Promise<Detection> {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const stmt = sqlite.prepare(`
      INSERT INTO detections (id, camera_id, image_url, detected_objects, detection_count, threat_level, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      detection.camera_id,
      detection.image_url,
      JSON.stringify(detection.detected_objects),
      detection.detection_count,
      detection.threat_level,
      timestamp
    );
    
    return { ...detection, id, timestamp } as Detection;
  }

  async getDetections(filters?: { camera_id?: string; threat_level?: string; start_date?: string; end_date?: string; limit?: number }): Promise<Detection[]> {
    let query = `SELECT * FROM detections WHERE 1=1`;
    const params: any[] = [];
    
    if (filters?.camera_id) {
      query += ` AND camera_id = ?`;
      params.push(filters.camera_id);
    }
    
    if (filters?.threat_level) {
      query += ` AND threat_level = ?`;
      params.push(filters.threat_level);
    }
    
    if (filters?.start_date) {
      query += ` AND timestamp >= ?`;
      params.push(filters.start_date);
    }
    
    if (filters?.end_date) {
      query += ` AND timestamp <= ?`;
      params.push(filters.end_date);
    }
    
    query += ` ORDER BY timestamp DESC`;
    
    if (filters?.limit) {
      query += ` LIMIT ?`;
      params.push(filters.limit);
    }
    
    const stmt = sqlite.prepare(query);
    const results = stmt.all(...params) as any[];
    
    return results.map(row => ({
      ...row,
      detected_objects: JSON.parse(row.detected_objects)
    })) as Detection[];
  }

  async getDetection(id: string): Promise<Detection | null> {
    const stmt = sqlite.prepare(`
      SELECT * FROM detections WHERE id = ?
    `);
    const result = stmt.get(id) as any;
    
    if (!result) return null;
    
    return {
      ...result,
      detected_objects: JSON.parse(result.detected_objects)
    } as Detection;
  }
}

export const storage = new DatabaseStorage();
