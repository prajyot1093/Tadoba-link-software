-- Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Geofences Table
CREATE TABLE IF NOT EXISTS geofences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    properties JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    geofence_id INTEGER REFERENCES geofences(id),
    url VARCHAR(500),
    latitude FLOAT,
    longitude FLOAT,
    heading FLOAT,
    status VARCHAR(50) DEFAULT 'offline',
    fps INTEGER DEFAULT 5,
    last_seen TIMESTAMP WITH TIME ZONE,
    camera_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Detections Table
CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    camera_id INTEGER REFERENCES cameras(id),
    geofence_id INTEGER REFERENCES geofences(id),
    detection_class VARCHAR(100) NOT NULL,
    confidence FLOAT NOT NULL,
    bbox JSONB NOT NULL,
    snapshot_path VARCHAR(500),
    location GEOMETRY(POINT, 4326),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    detection_id INTEGER REFERENCES detections(id),
    geofence_id INTEGER REFERENCES geofences(id),
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    description TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON geofences USING GIST(geometry);
CREATE INDEX IF NOT EXISTS idx_detections_location ON detections USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp);
CREATE INDEX IF NOT EXISTS idx_cameras_geofence ON cameras(geofence_id);
CREATE INDEX IF NOT EXISTS idx_detections_camera ON detections(camera_id);

-- Insert Demo Data
INSERT INTO users (username, email, hashed_password, role) 
VALUES ('admin', 'admin@tadoba.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK.X1qvQG.p2', 'department')
ON CONFLICT (username) DO NOTHING;

-- Insert Demo Geofence (Core Zone)
INSERT INTO geofences (name, zone_type, geometry, properties, created_by)
VALUES (
    'Tadoba Core Zone',
    'core',
    ST_GeomFromText('POLYGON((79.3 20.2, 79.35 20.2, 79.35 20.25, 79.3 20.25, 79.3 20.2))', 4326),
    '{"alert_priority": "high", "patrol_frequency": "daily"}',
    1
)
ON CONFLICT DO NOTHING;

-- Insert Demo Camera
INSERT INTO cameras (name, geofence_id, latitude, longitude, heading, status, created_by)
VALUES ('Demo Webcam', 1, 20.225, 79.325, 45.0, 'online', 1)
ON CONFLICT DO NOTHING;

SELECT 'Database initialized successfully!' AS message;
