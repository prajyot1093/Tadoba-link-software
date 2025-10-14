"""
Camera API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Camera, User
from schemas import CameraCreate, CameraResponse, CameraUpdate
from main import get_current_user

router = APIRouter(prefix="/api/cameras", tags=["cameras"])

@router.post("/", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def create_camera(
    camera: CameraCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Register a new camera
    
    Requires authentication. Creates a camera with specified type (laptop, RTSP, IP, dashcam)
    """
    db_camera = Camera(
        name=camera.name,
        type=camera.type,
        url=camera.url,
        latitude=camera.latitude,
        longitude=camera.longitude,
        heading=camera.heading,
        metadata=camera.metadata,
        created_by=current_user.id
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    
    return db_camera

@router.get("/", response_model=List[CameraResponse])
def list_cameras(
    type: Optional[str] = None,
    status: Optional[str] = None,
    active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all cameras with optional filtering
    
    Query parameters:
    - type: Filter by camera type (laptop, rtsp, ip, dashcam)
    - status: Filter by status (online, offline, maintenance, error)
    - active: Filter by active status (true/false)
    """
    query = db.query(Camera)
    
    if type:
        query = query.filter(Camera.type == type)
    if status:
        query = query.filter(Camera.status == status)
    if active is not None:
        query = query.filter(Camera.is_active == active)
    
    cameras = query.offset(skip).limit(limit).all()
    return cameras

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single camera by ID
    """
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with id {camera_id} not found"
        )
    
    return camera

@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: int,
    camera_update: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a camera's information
    """
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with id {camera_id} not found"
        )
    
    # Check permissions
    if db_camera.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this camera"
        )
    
    # Update fields
    update_data = camera_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_camera, field, value)
    
    db.commit()
    db.refresh(db_camera)
    
    return db_camera

@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a camera (soft delete)
    """
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with id {camera_id} not found"
        )
    
    # Check permissions
    if db_camera.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this camera"
        )
    
    # Soft delete
    db_camera.is_active = False
    db.commit()
    
    return None

@router.post("/{camera_id}/heartbeat")
def camera_heartbeat(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update camera last_seen timestamp (heartbeat)
    
    Used by camera clients to indicate they're still online
    """
    db_camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not db_camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Camera with id {camera_id} not found"
        )
    
    db_camera.last_seen = datetime.utcnow()
    db_camera.status = "online"
    db.commit()
    
    return {"message": "Heartbeat received", "last_seen": db_camera.last_seen}

@router.get("/stats/summary")
def get_camera_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary statistics about cameras
    """
    from sqlalchemy import func
    
    total = db.query(func.count(Camera.id)).scalar()
    online = db.query(func.count(Camera.id)).filter(Camera.status == "online").scalar()
    offline = db.query(func.count(Camera.id)).filter(Camera.status == "offline").scalar()
    maintenance = db.query(func.count(Camera.id)).filter(Camera.status == "maintenance").scalar()
    
    by_type = db.query(
        Camera.type,
        func.count(Camera.id)
    ).filter(Camera.is_active == True).group_by(Camera.type).all()
    
    return {
        "total_cameras": total,
        "online": online,
        "offline": offline,
        "maintenance": maintenance,
        "by_type": {cam_type: count for cam_type, count in by_type}
    }
