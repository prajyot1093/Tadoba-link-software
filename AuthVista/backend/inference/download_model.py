"""
YOLO Model Download Script
Downloads YOLOv8n model weights for wildlife detection
"""
import os
import urllib.request
from pathlib import Path

def download_yolo_model():
    """Download YOLOv8n model weights if not already present"""
    
    # Ensure models directory exists
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    model_path = models_dir / "yolov8n.pt"
    
    # Check if model already exists
    if model_path.exists():
        print(f"✅ Model already exists at: {model_path}")
        print(f"   Size: {model_path.stat().st_size / (1024*1024):.2f} MB")
        return str(model_path)
    
    # Download from Ultralytics GitHub releases
    model_url = "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt"
    
    print(f"📥 Downloading YOLOv8n model from: {model_url}")
    print(f"   Target: {model_path}")
    print("   This may take a few minutes...")
    
    try:
        # Download with progress callback
        def progress_callback(block_num, block_size, total_size):
            downloaded = block_num * block_size
            percent = min(100, downloaded * 100 / total_size)
            print(f"\r   Progress: {percent:.1f}% ({downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB)", end='')
        
        urllib.request.urlretrieve(model_url, model_path, progress_callback)
        print("\n✅ Download complete!")
        print(f"   Model saved to: {model_path}")
        print(f"   Size: {model_path.stat().st_size / (1024*1024):.2f} MB")
        
        return str(model_path)
        
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        if model_path.exists():
            model_path.unlink()  # Remove incomplete file
        raise

if __name__ == "__main__":
    print("🦁 Tadoba Wildlife Surveillance - YOLO Model Setup")
    print("=" * 60)
    model_path = download_yolo_model()
    print("=" * 60)
    print("🎯 Model ready for inference!")
    print(f"   Use this path in worker.py: {model_path}")
