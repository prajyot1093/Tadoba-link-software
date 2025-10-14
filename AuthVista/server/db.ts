import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for local development
export const sqlite = new Database('tadoba.db');
export const db = drizzle(sqlite, { schema });

// Initialize tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    role TEXT NOT NULL DEFAULT 'local',
    area TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS animals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    identification_marks TEXT,
    image_url TEXT,
    parent_id TEXT,
    status TEXT DEFAULT 'active',
    last_seen_location TEXT,
    last_seen_lat REAL,
    last_seen_lng REAL,
    last_seen_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES animals(id)
  );

  CREATE TABLE IF NOT EXISTS animal_locations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    animal_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    location TEXT,
    recorded_at TEXT DEFAULT (datetime('now')),
    recorded_by TEXT,
    FOREIGN KEY (animal_id) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS safari_bookings (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    guide_name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    number_of_people INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    animal_id TEXT NOT NULL,
    animal_name TEXT NOT NULL,
    distance REAL NOT NULL,
    user_area TEXT,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (animal_id) REFERENCES animals(id)
  );

  CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    zone TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS detections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    camera_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    detected_objects TEXT NOT NULL,
    detection_count INTEGER DEFAULT 0,
    threat_level TEXT DEFAULT 'low',
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (camera_id) REFERENCES cameras(id)
  );
`);
