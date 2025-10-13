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
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

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
    const userWithId = {
      ...userData,
      id: uuidv4(),
    };
    const [user] = await db.insert(users).values(userWithId).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
    const [animal] = await db.insert(animals).values({
      ...animalData,
      lastSeenAt: animalData.lastSeenLat && animalData.lastSeenLng ? new Date() : undefined,
    }).returning();
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
    const [location] = await db.insert(animalLocations).values(locationData).returning();
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
    const [zone] = await db.insert(safeZones).values(zoneData).returning();
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
    const [booking] = await db.insert(safariBookings).values(bookingData).returning();
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
    const [alert] = await db.insert(alerts).values(alertData).returning();
    return alert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }
}

export const storage = new DatabaseStorage();
