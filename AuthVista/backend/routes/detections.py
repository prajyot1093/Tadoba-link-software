"""
Detection API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from geoalchemy2.elements import WKTElement
from geoalchemy2.functions import ST_Contains

from database import get_db
from models import Detection, Camera, Geofence, User
from schemas import DetectionCreate, DetectionResponse
from main import get_current_user

router = APIRouter(prefix="/api/detections", tags=["detections"])

@router.post("/", response_model=DetectionResponse, status_code=status.HTTP_201_CREATED)
def create_detection(
    detection: DetectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new detection record
    
    This endpoint is typically called by the inference worker when YOLO detects an object.
    It automatically assigns the detection to a geofence if the camera has location data.
    """
    # Verify camera exists
    camera = db.query(Camera).filter(Camera.id == detection.camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with id {detection.camera_id} not found"
        )
    
    # Use camera location or provided location
    lat = detection.latitude or camera.latitude
    lon = detection.longitude or camera.longitude
    
    # Create detection record
    db_detection = Detection(
        camera_id=detection.camera_id,
        detection_class=detection.detection_class,
        confidence=detection.confidence,
        bbox=detection.bbox.dict(),
        snapshot_url=detection.snapshot_url,
        frame_id=detection.frame_id,
        latitude=lat,
        longitude=lon
    )
    
    # Set PostGIS location if coordinates available
    if lat and lon:
        db_detection.location = WKTElement(f'POINT({lon} {lat})', srid=4326)
        
        # Auto-assign to geofence
        point = WKTElement(f'POINT({lon} {lat})', srid=4326)
        geofence = db.query(Geofence).filter(
            ST_Contains(Geofence.geometry, point),
            Geofence.is_active == True
        ).first()
        
        if geofence:
            db_detection.geofence_id = geofence.id
    
    db.add(db_detection)
    db.commit()
    db.refresh(db_detection)
    
    return db_detection

@router.get("/", response_model=List[DetectionResponse])
def list_detections(
    camera_id: Optional[int] = None,
    detection_class: Optional[str] = None,
    min_confidence: Optional[float] = None,
    geofence_id: Optional[int] = None,
    hours: Optional[int] = 24,  # Last N hours
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List detections with filtering options
    
    Query parameters:
    - camera_id: Filter by specific camera
    - detection_class: Filter by class (person, car, weapon, etc.)
    - min_confidence: Minimum confidence threshold
    - geofence_id: Filter by geofence
    - hours: Look back period in hours (default: 24)
    """
    query = db.query(Detection)
    
    # Time filter
    if hours:
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(Detection.detected_at >= since)
    
    if camera_id:
        query = query.filter(Detection.camera_id == camera_id)
    if detection_class:
        query = query.filter(Detection.detection_class == detection_class)
    if min_confidence:
        query = query.filter(Detection.confidence >= min_confidence)
    if geofence_id:
        query = query.filter(Detection.geofence_id == geofence_id)
    
    detections = query.order_by(Detection.detected_at.desc()).offset(skip).limit(limit).all()
    return detections

@router.get("/{detection_id}", response_model=DetectionResponse)
def get_detection(
    detection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single detection by ID
    """
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if not detection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Detection with id {detection_id} not found"
        )
    
    return detection

@router.get("/stats/summary")
def get_detection_stats(
    hours: int = 24,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detection statistics for the specified time period
    """
    from sqlalchemy import func
    
    since = datetime.utcnow() - timedelta(hours=hours)
    
    total = db.query(func.count(Detection.id)).filter(Detection.detected_at >= since).scalar()
    
    # Count by class
    by_class = db.query(
        Detection.detection_class,
        func.count(Detection.id)
    ).filter(Detection.detected_at >= since).group_by(Detection.detection_class).all()
    
    # Count by geofence
    by_geofence = db.query(
        Geofence.name,
        Geofence.zone_type,
        func.count(Detection.id)
    ).join(Detection, Detection.geofence_id == Geofence.id).filter(
        Detection.detected_at >= since
    ).group_by(Geofence.name, Geofence.zone_type).all()
    
    # Average confidence
    avg_confidence = db.query(func.avg(Detection.confidence)).filter(
        Detection.detected_at >= since
    ).scalar()
    
    return {
        "period_hours": hours,
        "total_detections": total,
        "average_confidence": round(float(avg_confidence or 0), 3),
        "by_class": {cls: count for cls, count in by_class},
        "by_geofence": [
            {"name": name, "zone_type": zone_type, "count": count}
            for name, zone_type, count in by_geofence
        ]
    }

@router.get("/heatmap/data")
def get_heatmap_data(
    hours: int = 24,
    detection_class: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detection coordinates for heatmap visualization
    
    Returns array of [latitude, longitude, intensity] for mapping libraries
    """
    from sqlalchemy import func
    
    since = datetime.utcnow() - timedelta(hours=hours)
    
    query = db.query(
        Detection.latitude,
        Detection.longitude,
        func.count(Detection.id).label('count')
    ).filter(
        Detection.detected_at >= since,
        Detection.latitude.isnot(None),
        Detection.longitude.isnot(None)
    )
    
    if detection_class:
        query = query.filter(Detection.detection_class == detection_class)
    
    results = query.group_by(Detection.latitude, Detection.longitude).all()
    
    # Format for heatmap libraries (Leaflet.heat, Mapbox)
    heatmap_data = [
        [float(lat), float(lon), count]
        for lat, lon, count in results
    ]
    
    return {
        "period_hours": hours,
        "detection_class": detection_class,
        "points": heatmap_data,
        "total_points": len(heatmap_data)
    }
