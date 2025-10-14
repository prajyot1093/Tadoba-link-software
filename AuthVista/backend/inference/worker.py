"""
YOLO Inference Worker for Tadoba Wildlife Surveillance
Processes video frames and detects wildlife using YOLOv8
"""
import os
import asyncio
import base64
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

import cv2
import numpy as np
import requests
from ultralytics import YOLO
from loguru import logger
import socketio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
MODEL_PATH = os.getenv('MODEL_PATH', './models/yolov8n.pt')
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.5'))
SNAPSHOT_DIR = Path(os.getenv('SNAPSHOT_DIR', './snapshots'))

# Ensure snapshot directory exists
SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Wildlife classes we care about (COCO dataset)
WILDLIFE_CLASSES = {
    0: 'person',      # Human intrusion detection
    1: 'bicycle',
    2: 'car',
    3: 'motorcycle',
    14: 'bird',
    15: 'cat',
    16: 'dog',
    17: 'horse',
    18: 'sheep',
    19: 'cow',
    20: 'elephant',
    21: 'bear',
    22: 'zebra',
    23: 'giraffe',
}


class YOLOInferenceWorker:
    """
    YOLO Inference Worker
    - Receives frames via Socket.IO
    - Runs YOLOv8 inference
    - Posts detections to backend API
    - Broadcasts results via Socket.IO
    """
    
    def __init__(self):
        logger.info("🦁 Initializing YOLO Inference Worker...")
        
        # Load YOLO model
        logger.info(f"📦 Loading YOLO model from: {MODEL_PATH}")
        self.model = YOLO(MODEL_PATH)
        logger.success(f"✅ YOLO model loaded successfully")
        
        # Initialize Socket.IO client
        self.sio = socketio.AsyncClient(
            logger=False,
            engineio_logger=False
        )
        
        # Register event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('frame:ingest', self.process_frame)
        
        # Stats
        self.frames_processed = 0
        self.detections_made = 0
        
        logger.info(f"🎯 Confidence threshold: {CONFIDENCE_THRESHOLD}")
        logger.info(f"📡 Backend URL: {BACKEND_URL}")
    
    async def on_connect(self):
        """Handle Socket.IO connection"""
        logger.success(f"✅ Connected to backend at {BACKEND_URL}")
        await self.sio.emit('worker:ready', {
            'worker_type': 'yolo_inference',
            'model': 'yolov8n',
            'confidence_threshold': CONFIDENCE_THRESHOLD
        })
    
    async def on_disconnect(self):
        """Handle Socket.IO disconnection"""
        logger.warning("⚠️ Disconnected from backend")
    
    async def process_frame(self, data: Dict):
        """
        Process incoming frame from webcam or RTSP stream
        
        Args:
            data: {
                'frame': 'base64_encoded_image',
                'camera_id': int,
                'timestamp': str (ISO format),
                'geofence_id': int (optional)
            }
        """
        try:
            frame_start = datetime.now()
            
            # Decode base64 frame
            frame_b64 = data.get('frame')
            if not frame_b64:
                logger.error("❌ No frame data received")
                return
            
            # Decode image
            img_bytes = base64.b64decode(frame_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                logger.error("❌ Failed to decode frame")
                return
            
            camera_id = data.get('camera_id')
            geofence_id = data.get('geofence_id')
            timestamp = data.get('timestamp', datetime.utcnow().isoformat())
            
            logger.debug(f"📸 Processing frame from camera {camera_id}")
            
            # Run YOLO inference
            results = self.model.predict(
                frame,
                conf=CONFIDENCE_THRESHOLD,
                verbose=False
            )
            
            # Parse detections
            detections = []
            for result in results:
                boxes = result.boxes
                
                for i, box in enumerate(boxes):
                    # Extract box data
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    
                    # Filter for wildlife classes
                    if cls_id not in WILDLIFE_CLASSES:
                        continue
                    
                    class_name = WILDLIFE_CLASSES[cls_id]
                    
                    # Calculate bbox in YOLO format (center_x, center_y, width, height)
                    width = x2 - x1
                    height = y2 - y1
                    center_x = x1 + width / 2
                    center_y = y1 + height / 2
                    
                    bbox = {
                        'x': float(center_x),
                        'y': float(center_y),
                        'width': float(width),
                        'height': float(height),
                        # Also include corners for drawing
                        'x1': float(x1),
                        'y1': float(y1),
                        'x2': float(x2),
                        'y2': float(y2)
                    }
                    
                    detection = {
                        'camera_id': camera_id,
                        'geofence_id': geofence_id,
                        'detection_class': class_name,
                        'confidence': float(conf),
                        'bbox': bbox,
                        'timestamp': timestamp
                    }
                    
                    detections.append(detection)
                    logger.info(f"🎯 Detected: {class_name} ({conf:.2%} confidence)")
            
            # Save snapshot if detections found
            snapshot_path = None
            if detections:
                snapshot_path = await self.save_snapshot(frame, detections, camera_id)
            
            # Post detections to backend API
            for detection in detections:
                try:
                    detection['snapshot_path'] = snapshot_path
                    
                    response = requests.post(
                        f"{BACKEND_URL}/api/detections/",
                        json=detection,
                        timeout=5
                    )
                    
                    if response.status_code == 200:
                        detection_record = response.json()
                        logger.success(f"✅ Detection saved: ID {detection_record.get('id')}")
                        
                        # Broadcast detection via Socket.IO
                        await self.sio.emit('detection:created', detection_record)
                        
                        self.detections_made += 1
                    else:
                        logger.error(f"❌ Failed to save detection: {response.status_code}")
                
                except Exception as e:
                    logger.error(f"❌ Error posting detection: {e}")
            
            # Update stats
            self.frames_processed += 1
            
            # Broadcast frame processing result
            processing_time = (datetime.now() - frame_start).total_seconds()
            await self.sio.emit('frame:processed', {
                'camera_id': camera_id,
                'timestamp': timestamp,
                'detections_count': len(detections),
                'processing_time_ms': int(processing_time * 1000),
                'detections': detections  # Include bbox for client overlay
            })
            
            logger.debug(f"⏱️ Frame processed in {processing_time*1000:.0f}ms "
                        f"({len(detections)} detections)")
        
        except Exception as e:
            logger.error(f"❌ Error processing frame: {e}")
            logger.exception(e)
    
    async def save_snapshot(
        self,
        frame: np.ndarray,
        detections: List[Dict],
        camera_id: int
    ) -> str:
        """
        Save annotated frame snapshot
        
        Args:
            frame: OpenCV frame
            detections: List of detections with bboxes
            camera_id: Camera ID
            
        Returns:
            Snapshot file path
        """
        try:
            # Draw bounding boxes
            annotated_frame = frame.copy()
            
            for detection in detections:
                bbox = detection['bbox']
                class_name = detection['detection_class']
                confidence = detection['confidence']
                
                # Extract corners
                x1, y1 = int(bbox['x1']), int(bbox['y1'])
                x2, y2 = int(bbox['x2']), int(bbox['y2'])
                
                # Draw rectangle
                color = (0, 255, 0)  # Green
                if class_name == 'person':
                    color = (0, 0, 255)  # Red for human intrusion
                
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
                
                # Draw label
                label = f"{class_name} {confidence:.2%}"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                cv2.rectangle(
                    annotated_frame,
                    (x1, y1 - label_size[1] - 10),
                    (x1 + label_size[0], y1),
                    color,
                    -1
                )
                cv2.putText(
                    annotated_frame,
                    label,
                    (x1, y1 - 5),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (255, 255, 255),
                    2
                )
            
            # Save snapshot
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            filename = f"cam{camera_id}_{timestamp}.jpg"
            snapshot_path = SNAPSHOT_DIR / filename
            
            cv2.imwrite(str(snapshot_path), annotated_frame)
            logger.debug(f"📸 Snapshot saved: {snapshot_path}")
            
            return str(snapshot_path)
        
        except Exception as e:
            logger.error(f"❌ Error saving snapshot: {e}")
            return None
    
    async def start(self):
        """Start the inference worker"""
        try:
            logger.info(f"🚀 Starting YOLO Inference Worker...")
            logger.info(f"📡 Connecting to {BACKEND_URL}")
            
            # Connect to backend Socket.IO
            await self.sio.connect(
                BACKEND_URL,
                transports=['websocket'],
                wait_timeout=10
            )
            
            # Keep worker alive
            logger.success("✅ Worker started successfully")
            logger.info("👀 Waiting for frames...")
            
            while True:
                await asyncio.sleep(10)
                
                # Log stats every 10 seconds
                logger.info(f"📊 Stats: {self.frames_processed} frames, "
                           f"{self.detections_made} detections")
        
        except KeyboardInterrupt:
            logger.info("🛑 Shutting down worker...")
            await self.sio.disconnect()
        
        except Exception as e:
            logger.error(f"❌ Worker error: {e}")
            logger.exception(e)
            await self.sio.disconnect()


async def main():
    """Main entry point"""
    logger.info("=" * 70)
    logger.info("🦁 Tadoba Wildlife Surveillance - YOLO Inference Worker")
    logger.info("=" * 70)
    
    # Check if model exists
    if not Path(MODEL_PATH).exists():
        logger.error(f"❌ Model not found at: {MODEL_PATH}")
        logger.info("💡 Run: python download_model.py")
        return
    
    # Start worker
    worker = YOLOInferenceWorker()
    await worker.start()


if __name__ == "__main__":
    asyncio.run(main())
