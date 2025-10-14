import { useEffect, useRef, memo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'inactive' | 'maintenance';
  zone?: string;
}

interface Detection {
  id: string;
  camera_id: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface SurveillanceMapProps {
  cameras: Camera[];
  detections: Detection[];
  selectedCamera: string | null;
  onCameraSelect: (cameraId: string | null) => void;
}

export const SurveillanceMap = memo(function SurveillanceMap({ cameras, detections, selectedCamera, onCameraSelect }: SurveillanceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      // Tadoba Tiger Reserve center coordinates
      const map = L.map('surveillance-map', {
        center: [20.2347, 79.3291],
        zoom: 12,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add Tadoba reserve boundary (approximate)
      const tadobaBoundary = L.polygon([
        [20.30, 79.25],
        [20.30, 79.40],
        [20.15, 79.40],
        [20.15, 79.25],
      ], {
        color: '#16a34a',
        fillColor: '#22c55e',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      tadobaBoundary.bindPopup(`
        <div class="p-2">
          <strong>🐅 Tadoba Andhari Tiger Reserve</strong>
          <p class="text-sm text-gray-600 mt-1">Maharashtra, India</p>
          <p class="text-xs text-gray-500 mt-1">Area: ~1,727 km²</p>
        </div>
      `);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when cameras change
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Add new markers
    cameras.forEach(camera => {
      const cameraDetections = detections.filter(d => d.camera_id === camera.id);
      const criticalCount = cameraDetections.filter(d => d.threat_level === 'critical').length;
      const highCount = cameraDetections.filter(d => d.threat_level === 'high').length;

      // Create custom icon based on status
      const iconHtml = `
        <div class="relative">
          <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg ${
            camera.status === 'active' 
              ? 'bg-green-500 border-green-700' 
              : camera.status === 'maintenance'
              ? 'bg-yellow-500 border-yellow-700'
              : 'bg-gray-500 border-gray-700'
          }">
            <span class="text-white text-lg">📹</span>
          </div>
          ${criticalCount > 0 ? `
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
              <span class="text-white text-xs font-bold">!</span>
            </div>
          ` : ''}
          ${selectedCamera === camera.id ? `
            <div class="absolute -inset-2 border-2 border-blue-500 rounded-full animate-pulse"></div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-camera-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([camera.latitude, camera.longitude], {
        icon: customIcon,
      }).addTo(map);

      // Create popup content
      const popupContent = `
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center justify-between mb-2">
            <strong class="text-base">📹 ${camera.name}</strong>
            <span class="inline-block px-2 py-0.5 rounded text-xs font-medium ${
              camera.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : camera.status === 'maintenance'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }">
              ${camera.status.toUpperCase()}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-2">📍 ${camera.location}</p>
          ${camera.zone ? `<p class="text-xs text-gray-500 mb-2">Zone: ${camera.zone}</p>` : ''}
          <div class="border-t pt-2 mt-2">
            <p class="text-xs text-gray-600 mb-1"><strong>Detections:</strong> ${cameraDetections.length}</p>
            ${criticalCount > 0 ? `<p class="text-xs text-red-600 font-medium">🚨 ${criticalCount} Critical Alerts</p>` : ''}
            ${highCount > 0 ? `<p class="text-xs text-orange-600">⚠️ ${highCount} High Threats</p>` : ''}
          </div>
          <div class="mt-2 text-xs text-gray-500">
            📍 ${camera.latitude.toFixed(4)}, ${camera.longitude.toFixed(4)}
          </div>
          <button 
            class="mt-3 w-full px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            onclick="window.selectCamera && window.selectCamera('${camera.id}')"
          >
            ${selectedCamera === camera.id ? '✓ Selected' : 'Select Camera'}
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
      });

      marker.on('click', () => {
        if (selectedCamera === camera.id) {
          onCameraSelect(null);
        } else {
          onCameraSelect(camera.id);
        }
      });

      markersRef.current.set(camera.id, marker);
    });

    // Fit map to show all markers
    if (cameras.length > 0) {
      const bounds = L.latLngBounds(cameras.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [cameras, detections, selectedCamera, onCameraSelect]);

  // Handle camera selection from outside
  useEffect(() => {
    if (selectedCamera && markersRef.current.has(selectedCamera)) {
      const marker = markersRef.current.get(selectedCamera);
      if (marker && mapRef.current) {
        mapRef.current.setView(marker.getLatLng(), 14, { animate: true });
        marker.openPopup();
      }
    }
  }, [selectedCamera]);

  // Add global callback for popup button clicks
  useEffect(() => {
    (window as any).selectCamera = (cameraId: string) => {
      onCameraSelect(cameraId === selectedCamera ? null : cameraId);
    };
    return () => {
      delete (window as any).selectCamera;
    };
  }, [selectedCamera, onCameraSelect]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🗺️ Camera Network Map
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              🟢 Active
            </Badge>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              🟡 Maintenance
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              ⚫ Inactive
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          id="surveillance-map" 
          className="w-full h-[500px] rounded-lg border border-gray-300 relative z-0"
        />
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📹</span>
            <div>
              <p className="font-semibold">{cameras.length} Cameras</p>
              <p className="text-xs text-gray-600">Total deployed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-semibold">{detections.length} Detections</p>
              <p className="text-xs text-gray-600">Recent activity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-semibold">
                {detections.filter(d => d.threat_level === 'critical').length} Critical
              </p>
              <p className="text-xs text-gray-600">High priority alerts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
