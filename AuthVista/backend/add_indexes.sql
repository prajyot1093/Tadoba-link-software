-- ===================================================================
-- DATABASE INDEXES FOR PRODUCTION OPTIMIZATION
-- Apply these after deploying to Render or any production database
-- ===================================================================

-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ===================================================================
-- USER TABLE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);
-- Purpose: Fast role-based filtering (admin, ranger, viewer, local)

CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active);
-- Purpose: Active user queries, exclude inactive users

CREATE INDEX IF NOT EXISTS idx_users_created_at 
ON users(created_at DESC);
-- Purpose: Sorting users by registration date, pagination

CREATE INDEX IF NOT EXISTS idx_users_full_name 
ON users(full_name);
-- Purpose: Search and sort by user name

-- ===================================================================
-- GEOFENCE TABLE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_geofences_zone_type 
ON geofences(zone_type);
-- Purpose: Filter by zone type (core, buffer, safe)

CREATE INDEX IF NOT EXISTS idx_geofences_is_active 
ON geofences(is_active);
-- Purpose: Query only active geofences

CREATE INDEX IF NOT EXISTS idx_geofences_created_by 
ON geofences(created_by);
-- Purpose: Find geofences created by specific user

CREATE INDEX IF NOT EXISTS idx_geofences_created_at 
ON geofences(created_at DESC);
-- Purpose: Sort geofences by creation date

-- ===================================================================
-- CAMERA TABLE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_cameras_type 
ON cameras(type);
-- Purpose: Filter cameras by type (laptop, rtsp, ip, dashcam)

CREATE INDEX IF NOT EXISTS idx_cameras_status 
ON cameras(status);
-- Purpose: Find online/offline/maintenance cameras

CREATE INDEX IF NOT EXISTS idx_cameras_latitude 
ON cameras(latitude);
-- Purpose: Geospatial queries - latitude component

CREATE INDEX IF NOT EXISTS idx_cameras_longitude 
ON cameras(longitude);
-- Purpose: Geospatial queries - longitude component

CREATE INDEX IF NOT EXISTS idx_cameras_last_seen 
ON cameras(last_seen DESC);
-- Purpose: Find recently active cameras

CREATE INDEX IF NOT EXISTS idx_cameras_is_active 
ON cameras(is_active);
-- Purpose: Query only active cameras

CREATE INDEX IF NOT EXISTS idx_cameras_created_by 
ON cameras(created_by);
-- Purpose: Find cameras created by specific user

CREATE INDEX IF NOT EXISTS idx_cameras_created_at 
ON cameras(created_at DESC);
-- Purpose: Sort cameras by creation date

-- ===================================================================
-- DETECTION TABLE INDEXES (MOST CRITICAL FOR PERFORMANCE)
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_detections_camera_id 
ON detections(camera_id);
-- Purpose: Get all detections from specific camera (VERY FREQUENT)

CREATE INDEX IF NOT EXISTS idx_detections_detection_class 
ON detections(detection_class);
-- Purpose: Filter by object type (person, tiger, car, etc.)

CREATE INDEX IF NOT EXISTS idx_detections_confidence 
ON detections(confidence DESC);
-- Purpose: Filter high-confidence detections (>0.8)

CREATE INDEX IF NOT EXISTS idx_detections_frame_id 
ON detections(frame_id);
-- Purpose: Lookup detections from specific video frame

CREATE INDEX IF NOT EXISTS idx_detections_geofence_id 
ON detections(geofence_id);
-- Purpose: Get detections within specific geofence

CREATE INDEX IF NOT EXISTS idx_detections_detected_at 
ON detections(detected_at DESC);
-- Purpose: Temporal queries, recent detections (MOST IMPORTANT INDEX!)

-- PostGIS Spatial Index for location-based queries
CREATE INDEX IF NOT EXISTS idx_detections_location 
ON detections USING GIST(location);
-- Purpose: Fast geospatial queries (nearby detections, within radius)

-- ===================================================================
-- INCIDENT TABLE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_incidents_priority 
ON incidents(priority);
-- Purpose: Filter by priority (low, medium, high, critical)

CREATE INDEX IF NOT EXISTS idx_incidents_status 
ON incidents(status);
-- Purpose: Filter by status (open, in_progress, resolved)

CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to 
ON incidents(assigned_to);
-- Purpose: Get incidents assigned to specific user

CREATE INDEX IF NOT EXISTS idx_incidents_created_at 
ON incidents(created_at DESC);
-- Purpose: Sort incidents by creation date

-- ===================================================================
-- COMPOSITE INDEXES (FOR COMPLEX QUERIES)
-- ===================================================================

-- Detections by camera and date (very common query)
CREATE INDEX IF NOT EXISTS idx_detections_camera_date 
ON detections(camera_id, detected_at DESC);
-- Purpose: Get recent detections from specific camera

-- Detections by class and confidence (for analytics)
CREATE INDEX IF NOT EXISTS idx_detections_class_confidence 
ON detections(detection_class, confidence DESC);
-- Purpose: Get high-confidence detections of specific class

-- Active cameras with recent activity
CREATE INDEX IF NOT EXISTS idx_cameras_active_recent 
ON cameras(is_active, last_seen DESC) 
WHERE is_active = true;
-- Purpose: Find active cameras sorted by recent activity (partial index)

-- ===================================================================
-- VERIFY INDEXES
-- ===================================================================

-- Check all indexes in public schema
SELECT 
    schemaname,
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check index sizes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ===================================================================
-- PERFORMANCE TESTING QUERIES
-- ===================================================================

-- Test query performance (should use indexes)
-- EXPLAIN ANALYZE SELECT * FROM detections WHERE camera_id = 1 ORDER BY detected_at DESC LIMIT 10;
-- EXPLAIN ANALYZE SELECT * FROM detections WHERE detection_class = 'person' AND confidence > 0.8;
-- EXPLAIN ANALYZE SELECT * FROM cameras WHERE status = 'online' AND is_active = true;

-- Check if indexes are being used
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- ===================================================================
-- MAINTENANCE
-- ===================================================================

-- Rebuild indexes (if performance degrades over time)
-- REINDEX TABLE detections;
-- REINDEX TABLE cameras;

-- Update statistics (helps query planner)
-- ANALYZE detections;
-- ANALYZE cameras;

-- ===================================================================
-- NOTES
-- ===================================================================
-- 
-- IMPORTANT: Run this script AFTER running Alembic migrations
-- Expected performance improvement: 10-100x faster queries
-- 
-- Most critical indexes:
-- 1. idx_detections_detected_at (temporal queries)
-- 2. idx_detections_camera_id (per-camera queries)
-- 3. idx_detections_location (spatial queries)
-- 4. idx_cameras_status (online/offline filtering)
-- 
-- ===================================================================
