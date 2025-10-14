# Dockerfile for YOLO Inference Worker
FROM python:3.11-slim

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY inference/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy inference code
COPY inference/ ./inference/
COPY models/ ./models/

# Create snapshots directory
RUN mkdir -p ./snapshots

# Environment variables
ENV BACKEND_URL=http://backend:8000
ENV MODEL_PATH=./models/yolov8n.pt
ENV CONFIDENCE_THRESHOLD=0.5
ENV SNAPSHOT_DIR=./snapshots

# Run worker
CMD ["python", "inference/worker.py"]
