-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create spatial index function
CREATE OR REPLACE FUNCTION create_spatial_indexes()
RETURNS void AS $$
BEGIN
    -- Indexes will be created by Alembic migrations
    RAISE NOTICE 'PostGIS extensions enabled successfully';
END;
$$ LANGUAGE plpgsql;

SELECT create_spatial_indexes();
