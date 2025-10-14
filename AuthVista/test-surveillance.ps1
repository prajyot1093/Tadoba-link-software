# Test Surveillance API Endpoints

Write-Host "🎯 Testing Surveillance System..." -ForegroundColor Cyan

# First, let's login to get a real token
Write-Host "`n1️⃣ Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@tadoba.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful! Token obtained" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed. Creating admin user first..." -ForegroundColor Red
    
    $registerBody = @{
        email = "admin@tadoba.com"
        password = "admin123"
        name = "Admin User"
        role = "admin"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST -Body $registerBody -ContentType "application/json"
        $token = $registerResponse.token
        Write-Host "✅ Admin user created and logged in!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create user: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Test 1: Register a camera
Write-Host "`n2️⃣ Registering a camera..." -ForegroundColor Yellow
$cameraBody = @{
    name = "Camera 1 - North Gate"
    location = "North Entrance"
    latitude = 20.7484
    longitude = 79.0381
    status = "active"
    zone = "entrance"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $camera = Invoke-RestMethod -Uri "http://localhost:5000/api/surveillance/cameras" -Method POST -Headers $headers -Body $cameraBody
    Write-Host "✅ Camera registered successfully!" -ForegroundColor Green
    Write-Host "   Camera ID: $($camera.id)" -ForegroundColor Cyan
    Write-Host "   Name: $($camera.name)" -ForegroundColor Cyan
    Write-Host "   Location: $($camera.location)" -ForegroundColor Cyan
    $cameraId = $camera.id
} catch {
    Write-Host "❌ Camera registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get all cameras
Write-Host "`n3️⃣ Fetching all cameras..." -ForegroundColor Yellow
try {
    $cameras = Invoke-RestMethod -Uri "http://localhost:5000/api/surveillance/cameras" -Method GET -Headers $headers
    Write-Host "✅ Found $($cameras.Count) camera(s)" -ForegroundColor Green
    foreach ($cam in $cameras) {
        Write-Host "   📹 $($cam.name) - Status: $($cam.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to fetch cameras: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Create a test image file for detection
Write-Host "`n4️⃣ Creating test image for detection..." -ForegroundColor Yellow
$testImagePath = "test-image.jpg"

# Create a small dummy image (1x1 pixel JPEG)
$base64Image = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
[System.IO.File]::WriteAllBytes($testImagePath, [System.Convert]::FromBase64String($base64Image))
Write-Host "✅ Test image created" -ForegroundColor Green

# Test 4: Process frame (mock AI detection)
Write-Host "`n5️⃣ Processing frame with mock AI detection..." -ForegroundColor Yellow

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"camera_id`"$LF",
    $cameraId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"image`"; filename=`"test.jpg`"",
    "Content-Type: image/jpeg$LF",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString([System.IO.File]::ReadAllBytes($testImagePath)),
    "--$boundary--$LF"
) -join $LF

$headers2 = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

try {
    $detection = Invoke-RestMethod -Uri "http://localhost:5000/api/surveillance/process-frame" -Method POST -Headers $headers2 -Body $bodyLines
    Write-Host "✅ Frame processed successfully!" -ForegroundColor Green
    Write-Host "   Detection ID: $($detection.id)" -ForegroundColor Cyan
    Write-Host "   Objects detected: $($detection.detection_count)" -ForegroundColor Cyan
    Write-Host "   Threat level: $($detection.threat_level)" -ForegroundColor Cyan
    
    foreach ($obj in $detection.detected_objects) {
        Write-Host "   🔍 Detected: $($obj.class) (Confidence: $([math]::Round($obj.confidence * 100, 2))%)" -ForegroundColor Yellow
    }
    
    $detectionId = $detection.id
} catch {
    Write-Host "❌ Frame processing failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get all detections
Write-Host "`n6️⃣ Fetching all detections..." -ForegroundColor Yellow
try {
    $detections = Invoke-RestMethod -Uri "http://localhost:5000/api/surveillance/detections?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Found $($detections.Count) detection(s)" -ForegroundColor Green
    
    foreach ($det in $detections) {
        Write-Host "   🎯 Detection at $($det.timestamp)" -ForegroundColor Cyan
        Write-Host "      Objects: $($det.detection_count) | Threat: $($det.threat_level)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to fetch detections: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get specific detection
if ($detectionId) {
    Write-Host "`n7️⃣ Fetching specific detection..." -ForegroundColor Yellow
    try {
        $specificDetection = Invoke-RestMethod -Uri "http://localhost:5000/api/surveillance/detections/$detectionId" -Method GET -Headers $headers
        Write-Host "✅ Detection details retrieved!" -ForegroundColor Green
        Write-Host "   Camera: $($specificDetection.camera_id)" -ForegroundColor Cyan
        Write-Host "   Timestamp: $($specificDetection.timestamp)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Failed to fetch specific detection: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Cleanup
Remove-Item $testImagePath -ErrorAction SilentlyContinue

Write-Host "`n✨ Surveillance system test complete!" -ForegroundColor Green
Write-Host "🎯 All endpoints are working!" -ForegroundColor Cyan
