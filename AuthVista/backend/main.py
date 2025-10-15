"""
FastAPI main application with authentication, CORS, and WebSocket support
"""
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional
import os
import logging
from dotenv import load_dotenv

from database import get_db, init_db
from models import User, UserRole
from schemas import UserCreate, UserResponse, Token, UserLogin
import socketio

load_dotenv()

# ==================== LOGGING ====================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

# ==================== SECURITY ====================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit - truncate password if needed
    # Encode to bytes, take first 72 bytes, decode back to string
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ==================== FASTAPI APP ====================

app = FastAPI(
    title="Tadoba Wildlife Surveillance API",
    description="Real-time wildlife monitoring with YOLO detection and geofencing",
    version="1.0.0"
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    # Content Security Policy
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
    # Strict Transport Security
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    # X-Frame-Options
    response.headers["X-Frame-Options"] = "DENY"
    # X-Content-Type-Options
    response.headers["X-Content-Type-Options"] = "nosniff"
    # X-XSS-Protection
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # Referrer Policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # Permissions Policy
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO for real-time events
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=CORS_ORIGINS
)
socket_app = socketio.ASGIApp(sio, app)

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    logger.info("Database initialized")
    
    # Register API routes
    from routes import geofences, cameras, detections
    app.include_router(geofences.router)
    app.include_router(cameras.router)
    app.include_router(detections.router)
    logger.info("API routes registered")
    logger.info("FastAPI server ready")

# ==================== AUTH ROUTES ====================

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and return access token"""
    try:
        # Check if user exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Convert Pydantic enum to SQLAlchemy enum
        from models import UserRole as UserRoleModel
        role_value = user.role if isinstance(user.role, str) else user.role.value
        role_mapping = {
            "admin": UserRoleModel.ADMIN,
            "ranger": UserRoleModel.RANGER,
            "viewer": UserRoleModel.VIEWER,
            "local": UserRoleModel.LOCAL
        }
        db_role = role_mapping.get(role_value.lower(), UserRoleModel.VIEWER)
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            hashed_password=hashed_password,
            role=db_role  # Use mapped enum value
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Generate access token for the new user
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.username}, expires_delta=access_token_expires
        )
        
        # Return user info and token
        return {
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "firstName": db_user.full_name.split()[0] if db_user.full_name else "",
                "lastName": " ".join(db_user.full_name.split()[1:]) if db_user.full_name and len(db_user.full_name.split()) > 1 else "",
                "role": db_user.role.value if hasattr(db_user.role, 'value') else str(db_user.role)
            },
            "token": access_token
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@app.get("/api/auth/user", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info (alias for /me)"""
    return current_user

# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Tadoba Surveillance API"
    }

# ==================== WEBSOCKET ====================

# Connected workers tracking
connected_workers = {}

@sio.event
async def connect(sid, environ):
    """Client connected to WebSocket"""
    logger.info(f"Client {sid} connected")
    await sio.emit('connection', {'status': 'connected'}, room=sid)

@sio.event
async def disconnect(sid):
    """Client disconnected"""
    logger.info(f"Client {sid} disconnected")
    # Remove from workers if it was a worker
    if sid in connected_workers:
        worker_info = connected_workers.pop(sid)
        logger.info(f"Worker disconnected: {worker_info['worker_type']}")

@sio.event
async def worker_ready(sid, data):
    """Inference worker registered"""
    connected_workers[sid] = data
    logger.info(f"Worker ready: {data['worker_type']} (sid: {sid})")
    logger.info(f"  Model: {data.get('model', 'unknown')}")
    logger.info(f"  Confidence: {data.get('confidence_threshold', 'unknown')}")
    await sio.emit('worker:registered', {'status': 'registered', 'sid': sid}, room=sid)

@sio.event
async def frame_ingest(sid, data):
    """
    Frame received from webcam/RTSP for inference
    Forward to inference worker
    """
    # Broadcast to all connected inference workers
    worker_count = len([w for w in connected_workers.values() if w.get('worker_type') == 'yolo_inference'])
    
    if worker_count == 0:
        logger.warning("No inference workers available")
        await sio.emit('error', {'message': 'No inference workers available'}, room=sid)
        return
    
    # Forward frame to inference workers
    await sio.emit('frame:ingest', data)

@sio.event
async def detection_created(sid, data):
    """
    Detection result from inference worker
    Broadcast to all clients
    """
    logger.info(f"Detection broadcast: {data.get('detection_class')} "
          f"({data.get('confidence', 0):.2%})")
    await sio.emit('detection:created', data)

@sio.event
async def frame_processed(sid, data):
    """
    Frame processing completed
    Broadcast results to clients
    """
    await sio.emit('frame:processed', data)

# Function to broadcast detection events (called from inference worker)
async def broadcast_detection(detection_data: dict):
    """Broadcast detection to all connected clients"""
    await sio.emit('detection:created', detection_data)

async def broadcast_alert(alert_data: dict):
    """Broadcast alert to all connected clients"""
    await sio.emit('alert:created', alert_data)

# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:socket_app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
