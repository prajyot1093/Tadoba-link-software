import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with role-based access - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default('local'), // 'department' or 'local'
  area: varchar("area"), // For locals - their village/area name
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Animals table - stores tiger and other wildlife data
export const animals = pgTable("animals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  species: varchar("species", { length: 50 }).notNull(), // 'tiger', 'leopard', etc.
  age: integer("age"),
  gender: varchar("gender", { length: 10 }),
  identificationMarks: text("identification_marks"),
  imageUrl: varchar("image_url"),
  parentId: varchar("parent_id"), // For bloodline tracking
  status: varchar("status", { length: 20 }).default('active'), // 'active', 'relocated', 'deceased'
  lastSeenLocation: varchar("last_seen_location"),
  lastSeenLat: real("last_seen_lat"),
  lastSeenLng: real("last_seen_lng"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const animalsRelations = relations(animals, ({ one, many }) => ({
  parent: one(animals, {
    fields: [animals.parentId],
    references: [animals.id],
  }),
  children: many(animals),
  locations: many(animalLocations),
}));

export const insertAnimalSchema = createInsertSchema(animals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type Animal = typeof animals.$inferSelect;

// Animal locations - tracks movement history
export const animalLocations = pgTable("animal_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  animalId: varchar("animal_id").notNull().references(() => animals.id, { onDelete: 'cascade' }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  location: varchar("location"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  recordedBy: varchar("recorded_by").references(() => users.id),
});

export const animalLocationsRelations = relations(animalLocations, ({ one }) => ({
  animal: one(animals, {
    fields: [animalLocations.animalId],
    references: [animals.id],
  }),
}));

export const insertAnimalLocationSchema = createInsertSchema(animalLocations).omit({
  id: true,
  recordedAt: true,
});

export type InsertAnimalLocation = z.infer<typeof insertAnimalLocationSchema>;
export type AnimalLocation = typeof animalLocations.$inferSelect;

// Safe zones for cattle grazing
export const safeZones = pgTable("safe_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  area: varchar("area"), // Village/district name
  coordinates: jsonb("coordinates").notNull(), // Array of lat/lng points for polygon
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSafeZoneSchema = createInsertSchema(safeZones).omit({
  id: true,
  createdAt: true,
});

export type InsertSafeZone = z.infer<typeof insertSafeZoneSchema>;
export type SafeZone = typeof safeZones.$inferSelect;

// Safari bookings
export const safariBookings = pgTable("safari_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  guideName: varchar("guide_name", { length: 100 }).notNull(),
  vehicleType: varchar("vehicle_type", { length: 50 }).notNull(), // 'jeep', 'canter'
  date: timestamp("date").notNull(),
  timeSlot: varchar("time_slot", { length: 20 }).notNull(), // 'morning', 'evening'
  numberOfPeople: integer("number_of_people").notNull(),
  totalPrice: real("total_price").notNull(),
  status: varchar("status", { length: 20 }).default('confirmed').notNull(), // 'confirmed', 'cancelled', 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const safariBookingsRelations = relations(safariBookings, ({ one }) => ({
  user: one(users, {
    fields: [safariBookings.userId],
    references: [users.id],
  }),
}));

export const insertSafariBookingSchema = createInsertSchema(safariBookings).omit({
  id: true,
  createdAt: true,
});

export type InsertSafariBooking = z.infer<typeof insertSafariBookingSchema>;
export type SafariBooking = typeof safariBookings.$inferSelect;

// Proximity alerts
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  animalId: varchar("animal_id").notNull().references(() => animals.id),
  animalName: varchar("animal_name", { length: 100 }).notNull(),
  distance: real("distance").notNull(), // in kilometers
  userArea: varchar("user_area"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  animal: one(animals, {
    fields: [alerts.animalId],
    references: [animals.id],
  }),
}));

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
