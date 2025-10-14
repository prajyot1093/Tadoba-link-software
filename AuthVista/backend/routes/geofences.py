"""
Geofence API routes with PostGIS spatial queries
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_GeomFromGeoJSON, ST_Contains, ST_AsGeoJSON, ST_Distance
from geoalchemy2.elements import WKTElement
from typing import List, Optional
import json

from database import get_db
from models import Geofence, User
from schemas import GeofenceCreate, GeofenceResponse, GeofenceUpdate
from main import get_current_user

router = APIRouter(prefix="/api/geofences", tags=["geofences"])

@router.post("/", response_model=GeofenceResponse, status_code=status.HTTP_201_CREATED)
def create_geofence(
    geofence: GeofenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new geofence with GeoJSON polygon
    
    Requires authentication. The polygon coordinates should be in [longitude, latitude] format.
    """
    try:
        # Convert GeoJSON to PostGIS geometry
        geom_json = json.dumps(geofence.geometry)
        geom = ST_GeomFromGeoJSON(geom_json)
        
        db_geofence = Geofence(
            name=geofence.name,
            zone_type=geofence.zone_type,
            geometry=geom,
            description=geofence.description,
            color=geofence.color,
            properties=geofence.properties,
            created_by=current_user.id
        )
        db.add(db_geofence)
        db.commit()
        db.refresh(db_geofence)
        
        # Convert geometry back to GeoJSON for response
        geojson_str = db.query(ST_AsGeoJSON(db_geofence.geometry)).scalar()
        db_geofence.geometry = json.loads(geojson_str)
        
        return db_geofence
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid GeoJSON geometry: {str(e)}"
        )

@router.get("/", response_model=List[GeofenceResponse])
def list_geofences(
    zone_type: Optional[str] = None,
    active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all geofences with optional filtering
    
    Query parameters:
    - zone_type: Filter by zone type (core, buffer, safe)
    - active: Filter by active status (true/false)
    - skip: Number of records to skip (pagination)
    - limit: Maximum number of records to return
    """
    query = db.query(Geofence)
    
    if zone_type:
        query = query.filter(Geofence.zone_type == zone_type)
    if active is not None:
        query = query.filter(Geofence.is_active == active)
    
    geofences = query.offset(skip).limit(limit).all()
    
    # Convert geometries to GeoJSON
    for gf in geofences:
        geojson_str = db.query(ST_AsGeoJSON(gf.geometry)).scalar()
        gf.geometry = json.loads(geojson_str)
    
    return geofences

@router.get("/{geofence_id}", response_model=GeofenceResponse)
def get_geofence(
    geofence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a single geofence by ID
    """
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geofence with id {geofence_id} not found"
        )
    
    # Convert geometry to GeoJSON
    geojson_str = db.query(ST_AsGeoJSON(geofence.geometry)).scalar()
    geofence.geometry = json.loads(geojson_str)
    
    return geofence

@router.put("/{geofence_id}", response_model=GeofenceResponse)
def update_geofence(
    geofence_id: int,
    geofence_update: GeofenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing geofence
    
    Only the creator or admin can update a geofence
    """
    db_geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not db_geofence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geofence with id {geofence_id} not found"
        )
    
    # Check permissions
    if db_geofence.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this geofence"
        )
    
    # Update fields
    update_data = geofence_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_geofence, field, value)
    
    db.commit()
    db.refresh(db_geofence)
    
    # Convert geometry to GeoJSON
    geojson_str = db.query(ST_AsGeoJSON(db_geofence.geometry)).scalar()
    db_geofence.geometry = json.loads(geojson_str)
    
    return db_geofence

@router.delete("/{geofence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_geofence(
    geofence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a geofence (soft delete by setting is_active to False)
    
    Only the creator or admin can delete a geofence
    """
    db_geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not db_geofence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Geofence with id {geofence_id} not found"
        )
    
    # Check permissions
    if db_geofence.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this geofence"
        )
    
    # Soft delete
    db_geofence.is_active = False
    db.commit()
    
    return None

@router.post("/check")
def check_containment(
    lat: float,
    lon: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check which geofence (if any) contains the given point
    
    Parameters:
    - lat: Latitude in decimal degrees
    - lon: Longitude in decimal degrees
    
    Returns the geofence that contains the point, or None if no match found
    """
    # Create PostGIS point (lon, lat order for WKT)
    point = WKTElement(f'POINT({lon} {lat})', srid=4326)
    
    # Find geofence containing the point
    geofence = db.query(Geofence).filter(
        ST_Contains(Geofence.geometry, point),
        Geofence.is_active == True
    ).first()
    
    if not geofence:
        return {
            "contained": False,
            "geofence": None,
            "message": "Point is not inside any active geofence"
        }
    
    return {
        "contained": True,
        "geofence": {
            "id": geofence.id,
            "name": geofence.name,
            "zone_type": geofence.zone_type,
            "color": geofence.color,
            "description": geofence.description
        }
    }

@router.post("/check-distance")
def check_distance(
    lat: float,
    lon: float,
    max_distance: float = 5000.0,  # Default 5km in meters
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Find all geofences within a specified distance from a point
    
    Parameters:
    - lat: Latitude in decimal degrees
    - lon: Longitude in decimal degrees
    - max_distance: Maximum distance in meters (default: 5000)
    
    Returns list of geofences within distance, sorted by proximity
    """
    from sqlalchemy import func
    
    point = WKTElement(f'POINT({lon} {lat})', srid=4326)
    
    # Find geofences within distance, ordered by proximity
    results = db.query(
        Geofence,
        func.ST_Distance(
            func.ST_Transform(Geofence.geometry, 3857),  # Web Mercator for meters
            func.ST_Transform(point, 3857)
        ).label('distance')
    ).filter(
        Geofence.is_active == True,
        func.ST_DWithin(
            func.ST_Transform(Geofence.geometry, 3857),
            func.ST_Transform(point, 3857),
            max_distance
        )
    ).order_by('distance').all()
    
    geofences_with_distance = []
    for geofence, distance in results:
        geofences_with_distance.append({
            "id": geofence.id,
            "name": geofence.name,
            "zone_type": geofence.zone_type,
            "color": geofence.color,
            "distance_meters": round(distance, 2)
        })
    
    return {
        "point": {"lat": lat, "lon": lon},
        "max_distance_meters": max_distance,
        "geofences_found": len(geofences_with_distance),
        "geofences": geofences_with_distance
    }

@router.get("/stats/summary")
def get_geofence_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get summary statistics about geofences
    """
    from sqlalchemy import func
    
    total = db.query(func.count(Geofence.id)).scalar()
    active = db.query(func.count(Geofence.id)).filter(Geofence.is_active == True).scalar()
    
    by_type = db.query(
        Geofence.zone_type,
        func.count(Geofence.id)
    ).filter(Geofence.is_active == True).group_by(Geofence.zone_type).all()
    
    return {
        "total_geofences": total,
        "active_geofences": active,
        "inactive_geofences": total - active,
        "by_zone_type": {zone_type: count for zone_type, count in by_type}
    }
