"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

# ==================== ENUMS ====================

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    RANGER = "ranger"
    VIEWER = "viewer"
    LOCAL = "local"

class ZoneTypeEnum(str, Enum):
    CORE = "core"
    BUFFER = "buffer"
    SAFE = "safe"

class CameraTypeEnum(str, Enum):
    LAPTOP = "laptop"
    RTSP = "rtsp"
    IP = "ip"
    DASHCAM = "dashcam"

class DetectionClassEnum(str, Enum):
    PERSON = "person"
    CAR = "car"
    WEAPON = "weapon"
    TIGER = "tiger"
    ELEPHANT = "elephant"

# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRoleEnum = UserRoleEnum.VIEWER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ==================== GEOFENCE SCHEMAS ====================

class GeofenceBase(BaseModel):
    name: str
    zone_type: ZoneTypeEnum
    description: Optional[str] = None
    color: str = "#22c55e"
    properties: Dict[str, Any] = {}

class GeofenceCreate(GeofenceBase):
    geometry: Dict[str, Any]  # GeoJSON polygon

class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class GeofenceResponse(GeofenceBase):
    id: int
    geometry: Dict[str, Any]
    is_active: bool
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== CAMERA SCHEMAS ====================

class CameraBase(BaseModel):
    name: str
    type: CameraTypeEnum
    url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    heading: Optional[float] = None

class CameraCreate(CameraBase):
    metadata: Dict[str, Any] = {}

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class CameraResponse(CameraBase):
    id: int
    status: str
    fps: int
    last_seen: Optional[datetime]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== DETECTION SCHEMAS ====================

class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class DetectionCreate(BaseModel):
    camera_id: int
    detection_class: DetectionClassEnum
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: BoundingBox
    snapshot_url: Optional[str] = None
    frame_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class DetectionResponse(BaseModel):
    id: int
    camera_id: int
    detection_class: str
    confidence: float
    bbox: Dict[str, float]
    snapshot_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    geofence_id: Optional[int]
    detected_at: datetime
    
    class Config:
        from_attributes = True

# ==================== WEBSOCKET MESSAGES ====================

class DetectionEvent(BaseModel):
    event: str = "detection:create"
    data: DetectionResponse

class CameraStatusEvent(BaseModel):
    event: str = "camera:update"
    camera_id: int
    status: str
    last_seen: datetime

class AlertEvent(BaseModel):
    event: str = "alert:create"
    priority: str
    message: str
    detection_id: Optional[int]
    snapshot_url: Optional[str]
    created_at: datetime
