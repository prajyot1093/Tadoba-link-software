"""
Test script for API routes
Run this after starting the backend to test all endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication...")
    
    # Register user
    register_data = {
        "email": "test@tadoba.com",
        "username": "testuser",
        "full_name": "Test User",
        "password": "testpass123",
        "role": "ranger"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 201:
            print("✅ User registered successfully")
        elif response.status_code == 400:
            print("⚠️  User already exists (expected if running multiple times)")
        else:
            print(f"❌ Registration failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Login
    login_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            data=login_data,  # OAuth2 uses form data
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            print("✅ Login successful")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_geofences(token):
    """Test geofence endpoints"""
    print("\n🗺️  Testing Geofences...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create geofence
    geofence_data = {
        "name": "Core Zone Alpha",
        "zone_type": "core",
        "description": "High-priority protection zone",
        "color": "#ef4444",
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [79.33, 20.23],
                [79.35, 20.23],
                [79.35, 20.25],
                [79.33, 20.25],
                [79.33, 20.23]
            ]]
        },
        "properties": {"patrol_frequency": "hourly"}
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/geofences/",
            json=geofence_data,
            headers=headers
        )
        if response.status_code == 201:
            geofence = response.json()
            print(f"✅ Geofence created: ID {geofence['id']}, Name: {geofence['name']}")
            geofence_id = geofence['id']
        else:
            print(f"❌ Geofence creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # List geofences
    try:
        response = requests.get(f"{BASE_URL}/api/geofences/", headers=headers)
        if response.status_code == 200:
            geofences = response.json()
            print(f"✅ Retrieved {len(geofences)} geofences")
        else:
            print(f"❌ Failed to list geofences: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Check point containment (inside)
    try:
        response = requests.post(
            f"{BASE_URL}/api/geofences/check",
            params={"lat": 20.24, "lon": 79.34},
            headers=headers
        )
        if response.status_code == 200:
            result = response.json()
            if result["contained"]:
                print(f"✅ Point is inside geofence: {result['geofence']['name']}")
            else:
                print("✅ Point is not inside any geofence (as expected)")
        else:
            print(f"❌ Containment check failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Get geofence stats
    try:
        response = requests.get(f"{BASE_URL}/api/geofences/stats/summary", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Geofence stats: {stats['total_geofences']} total, {stats['active_geofences']} active")
        else:
            print(f"❌ Failed to get stats: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_cameras(token):
    """Test camera endpoints"""
    print("\n📹 Testing Cameras...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create camera
    camera_data = {
        "name": "North Gate Camera",
        "type": "rtsp",
        "url": "rtsp://example.com/stream1",
        "latitude": 20.25,
        "longitude": 79.35,
        "heading": 90.0,
        "metadata": {"resolution": "1080p", "fps": 30}
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/cameras/",
            json=camera_data,
            headers=headers
        )
        if response.status_code == 201:
            camera = response.json()
            print(f"✅ Camera created: ID {camera['id']}, Name: {camera['name']}")
            camera_id = camera['id']
        else:
            print(f"❌ Camera creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # List cameras
    try:
        response = requests.get(f"{BASE_URL}/api/cameras/", headers=headers)
        if response.status_code == 200:
            cameras = response.json()
            print(f"✅ Retrieved {len(cameras)} cameras")
        else:
            print(f"❌ Failed to list cameras: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Send heartbeat
    try:
        response = requests.post(
            f"{BASE_URL}/api/cameras/{camera_id}/heartbeat",
            headers=headers
        )
        if response.status_code == 200:
            print("✅ Camera heartbeat sent")
        else:
            print(f"❌ Heartbeat failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Get camera stats
    try:
        response = requests.get(f"{BASE_URL}/api/cameras/stats/summary", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Camera stats: {stats['total_cameras']} total, {stats['online']} online")
        else:
            print(f"❌ Failed to get stats: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return camera_id

def test_detections(token, camera_id):
    """Test detection endpoints"""
    print("\n🔍 Testing Detections...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create detection
    detection_data = {
        "camera_id": camera_id,
        "detection_class": "person",
        "confidence": 0.95,
        "bbox": {
            "x": 100,
            "y": 200,
            "width": 50,
            "height": 80
        },
        "snapshot_url": "https://example.com/snapshot123.jpg",
        "frame_id": "frame_001",
        "latitude": 20.24,
        "longitude": 79.34
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/detections/",
            json=detection_data,
            headers=headers
        )
        if response.status_code == 201:
            detection = response.json()
            print(f"✅ Detection created: ID {detection['id']}, Class: {detection['detection_class']}")
            if detection.get('geofence_id'):
                print(f"   Auto-assigned to geofence ID: {detection['geofence_id']}")
        else:
            print(f"❌ Detection creation failed: {response.text}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # List detections
    try:
        response = requests.get(f"{BASE_URL}/api/detections/", headers=headers)
        if response.status_code == 200:
            detections = response.json()
            print(f"✅ Retrieved {len(detections)} detections")
        else:
            print(f"❌ Failed to list detections: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Get detection stats
    try:
        response = requests.get(f"{BASE_URL}/api/detections/stats/summary", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Detection stats: {stats['total_detections']} in last {stats['period_hours']} hours")
        else:
            print(f"❌ Failed to get stats: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Get heatmap data
    try:
        response = requests.get(f"{BASE_URL}/api/detections/heatmap/data", headers=headers)
        if response.status_code == 200:
            heatmap = response.json()
            print(f"✅ Heatmap data: {heatmap['total_points']} points")
        else:
            print(f"❌ Failed to get heatmap: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    """Run all tests"""
    print("🚀 Starting API Tests...")
    print(f"   Base URL: {BASE_URL}")
    
    # Test authentication
    token = test_auth()
    if not token:
        print("\n❌ Authentication failed. Cannot proceed with other tests.")
        return
    
    # Test geofences
    test_geofences(token)
    
    # Test cameras
    camera_id = test_cameras(token)
    
    # Test detections
    if camera_id:
        test_detections(token, camera_id)
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    main()
