"""
SQLAlchemy models with PostGIS geometry support
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    RANGER = "ranger"
    VIEWER = "viewer"
    LOCAL = "local"

class ZoneType(str, enum.Enum):
    CORE = "core"
    BUFFER = "buffer"
    SAFE = "safe"

class CameraType(str, enum.Enum):
    LAPTOP = "laptop"
    RTSP = "rtsp"
    IP = "ip"
    DASHCAM = "dashcam"

class CameraStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class DetectionClass(str, enum.Enum):
    PERSON = "person"
    CAR = "car"
    TRUCK = "truck"
    WEAPON = "weapon"
    TIGER = "tiger"
    LEOPARD = "leopard"
    ELEPHANT = "elephant"
    DEER = "deer"
    UNKNOWN = "unknown"

class IncidentPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FALSE_ALARM = "false_alarm"

# ==================== MODELS ====================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, index=True)  # Add index for sorting/searching
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False, index=True)  # Index for role filtering
    is_active = Column(Boolean, default=True, index=True)  # Index for active user queries
    phone = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # Index for sorting
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    geofences = relationship("Geofence", back_populates="creator")
    cameras = relationship("Camera", back_populates="creator")
    incidents = relationship("Incident", back_populates="assigned_user")

class Geofence(Base):
    __tablename__ = "geofences"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    zone_type = Column(Enum(ZoneType), nullable=False, index=True)  # Index for zone type filtering
    # PostGIS geometry column - stores polygon as GeoJSON
    geometry = Column(Geometry('POLYGON', srid=4326), nullable=False)
    description = Column(Text)
    color = Column(String(7), default="#22c55e")  # Hex color
    properties = Column(JSON, default={})  # Extra metadata (patrol schedule, sensitivity, etc.)
    is_active = Column(Boolean, default=True, index=True)  # Index for active geofence queries
    created_by = Column(Integer, ForeignKey("users.id"), index=True)  # Index for creator queries
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="geofences")
    detections = relationship("Detection", back_populates="geofence")

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(Enum(CameraType), nullable=False, index=True)  # Index for camera type filtering
    url = Column(String)  # RTSP URL or stream endpoint
    latitude = Column(Float, index=True)  # Index for geospatial queries
    longitude = Column(Float, index=True)
    heading = Column(Float)  # Camera direction in degrees (0-360)
    status = Column(Enum(CameraStatus), default=CameraStatus.OFFLINE, index=True)  # Index for status filtering
    fps = Column(Integer, default=5)
    last_seen = Column(DateTime(timezone=True), index=True)  # Index for recent activity queries
    camera_metadata = Column(JSON, default={})  # RTSP credentials (encrypted), resolution, etc.
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", back_populates="cameras")
    detections = relationship("Detection", back_populates="camera")

class Detection(Base):
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False, index=True)  # Index for camera queries
    detection_class = Column(Enum(DetectionClass), nullable=False, index=True)  # Index for class filtering
    confidence = Column(Float, nullable=False, index=True)  # Index for confidence filtering
    bbox = Column(JSON, nullable=False)  # {"x": 100, "y": 200, "width": 50, "height": 80}
    snapshot_url = Column(String)  # S3 URL or local path
    frame_id = Column(String, index=True)  # Index for frame queries
    # Geolocation (derived from camera lat/lon + heading if available)
    latitude = Column(Float)
    longitude = Column(Float)
    location = Column(Geometry('POINT', srid=4326), index=True)  # PostGIS spatial index
    geofence_id = Column(Integer, ForeignKey("geofences.id"), index=True)  # Index for geofence queries
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    camera = relationship("Camera", back_populates="detections")
    geofence = relationship("Geofence", back_populates="detections")
    incident = relationship("Incident", back_populates="detection", uselist=False)

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("detections.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    priority = Column(Enum(IncidentPriority), default=IncidentPriority.MEDIUM)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.OPEN)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    detection = relationship("Detection", back_populates="incident")
    assigned_user = relationship("User", back_populates="incidents")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    alert_type = Column(String)  # geofence_breach, weapon_detected, etc.
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Animal(Base):
    __tablename__ = "animals"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)
    tag_id = Column(String, unique=True)  # GPS collar tag
    last_seen_location = Column(Geometry('POINT', srid=4326))
    last_seen_at = Column(DateTime(timezone=True))
    status = Column(String, default="active")  # active, relocated, deceased
    animal_metadata = Column(JSON, default={})  # Age, gender, health notes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
