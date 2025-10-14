-- Enable PostGIS Extension (Required for spatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Success message
SELECT 'PostGIS extension enabled successfully!' AS status;
