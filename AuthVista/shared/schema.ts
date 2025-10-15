// Shared TypeScript schemas for frontend and backend
// This file defines common types used across the application

export interface Animal {
  id: number;
  name: string;
  species: string;
  age?: number;
  gender?: string;
  identificationMarks?: string;
  lastSeen?: string;
  lastSeenAt?: string;
  lastSeenLocation?: string;
  lastSeenLat?: number;
  lastSeenLng?: number;
  location?: {
    lat: number;
    lng: number;
  };
  status?: string;
  imageUrl?: string;
  description?: string;
}

export interface InsertAnimal {
  name: string;
  species: string;
  age?: number;
  gender?: string;
  identificationMarks?: string;
  lastSeen?: string;
  lastSeenAt?: string;
  lastSeenLocation?: string;
  lastSeenLat?: number;
  lastSeenLng?: number;
  location?: {
    lat: number;
    lng: number;
  };
  status?: string;
  imageUrl?: string;
  description?: string;
}

export interface Alert {
  id: number;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  createdAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  animalName?: string;
  distance?: number;
  isRead?: boolean;
}

export interface SafariBooking {
  id: number;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  numberOfPeople: number;
  vehicleType?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalAmount?: number;
  specialRequests?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: 'admin' | 'ranger' | 'viewer' | 'local';
  isActive: boolean;
  createdAt: string;
}

export interface Detection {
  id: number;
  cameraId: number;
  detectionClass: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  snapshotUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  detectedAt: string;
}

export interface Camera {
  id: number;
  name: string;
  type: 'laptop' | 'rtsp' | 'ip' | 'dashcam';
  url?: string;
  latitude?: number;
  longitude?: number;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen?: string;
  isActive: boolean;
}

export interface Geofence {
  id: number;
  name: string;
  zoneType: 'core' | 'buffer' | 'safe';
  geometry: any; // GeoJSON geometry
  description?: string;
  color?: string;
  isActive: boolean;
}
