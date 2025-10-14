import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Animal } from "@shared/schema";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { PawPrint, Camera, TreePine, Leaf, MapPin, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Demo camera locations across Tadoba
const CAMERA_LOCATIONS = [
  { id: 1, name: "North Gate", lat: 20.2500, lng: 79.3500, status: 'online', lastDetection: 'Tiger - 5 min ago', threat: false },
  { id: 2, name: "Lake View", lat: 20.2300, lng: 79.3300, status: 'online', lastDetection: 'Elephant - 12 min ago', threat: false },
  { id: 3, name: "Forest Core", lat: 20.2400, lng: 79.3450, status: 'alert', lastDetection: 'Poacher - NOW', threat: true },
  { id: 4, name: "South Trail", lat: 20.2200, lng: 79.3250, status: 'online', lastDetection: 'Leopard - 1 hour ago', threat: false },
  { id: 5, name: "East Boundary", lat: 20.2450, lng: 79.3600, status: 'online', lastDetection: 'Deer - 3 min ago', threat: false },
  { id: 6, name: "West Ridge", lat: 20.2350, lng: 79.3150, status: 'online', lastDetection: 'No activity', threat: false },
  { id: 7, name: "Central Zone", lat: 20.2380, lng: 79.3420, status: 'online', lastDetection: 'Tiger - 18 min ago', threat: false },
  { id: 8, name: "River Crossing", lat: 20.2280, lng: 79.3380, status: 'online', lastDetection: 'Buffalo - 25 min ago', threat: false },
  { id: 9, name: "Bamboo Grove", lat: 20.2420, lng: 79.3280, status: 'maintenance', lastDetection: 'Offline', threat: false },
  { id: 10, name: "Watchtower", lat: 20.2320, lng: 79.3480, status: 'online', lastDetection: 'Wild Dog - 7 min ago', threat: false },
  { id: 11, name: "Buffer Zone", lat: 20.2180, lng: 79.3320, status: 'online', lastDetection: 'Sloth Bear - 40 min ago', threat: false },
  { id: 12, name: "Safari Route", lat: 20.2440, lng: 79.3380, status: 'online', lastDetection: 'Gaur - 15 min ago', threat: false },
];

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCamera, setSelectedCamera] = useState<typeof CAMERA_LOCATIONS[0] | null>(null);
  const [showAnimals, setShowAnimals] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Tadoba
    const map = L.map(mapContainerRef.current).setView([20.2347, 79.3401], 12);

    // FREE OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add camera markers
  useEffect(() => {
    if (!mapRef.current || !showCameras) return;

    const markers: L.Marker[] = [];
    const circles: L.Circle[] = [];

    CAMERA_LOCATIONS.forEach((camera) => {
      const statusColor = camera.threat ? 'bg-red-500' : 
                          camera.status === 'maintenance' ? 'bg-gray-400' : 
                          'bg-green-500';

      const markerIcon = L.divIcon({
        className: 'custom-camera-marker',
        html: `<div class="w-10 h-10 rounded-full ${statusColor} flex items-center justify-center border-3 border-white shadow-lg ${camera.threat ? 'animate-pulse' : ''}">
          <span class="text-white text-xl">📹</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([camera.lat, camera.lng], { icon: markerIcon })
        .addTo(mapRef.current!);

      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-bold text-base mb-1">Camera ${camera.id}: ${camera.name}</h3>
          <p class="text-sm ${camera.threat ? 'text-red-600 font-semibold' : 'text-gray-600'} mb-2">${camera.lastDetection}</p>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded-full ${
              camera.threat ? 'bg-red-100 text-red-700' :
              camera.status === 'maintenance' ? 'bg-gray-100 text-gray-700' :
              'bg-green-100 text-green-700'
            }">${camera.status.toUpperCase()}</span>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedCamera(camera);
      });

      markers.push(marker);

      // Add detection radius for active cameras
      if (camera.status === 'online' || camera.status === 'alert') {
        const circle = L.circle([camera.lat, camera.lng], {
          color: camera.threat ? '#ef4444' : '#22c55e',
          fillColor: camera.threat ? '#ef4444' : '#22c55e',
          fillOpacity: 0.08,
          radius: 800, // 800m detection radius
        }).addTo(mapRef.current!);
        circles.push(circle);
      }
    });

    return () => {
      markers.forEach(m => m.remove());
      circles.forEach(c => c.remove());
    };
  }, [showCameras]);

  // Add animal markers
  useEffect(() => {
    if (!mapRef.current || !showAnimals) return;

    const markers: L.Marker[] = [];
    const circles: L.Circle[] = [];

    animals.forEach((animal) => {
      if (animal.lastSeenLat && animal.lastSeenLng) {
        const markerIcon = L.divIcon({
          className: 'custom-animal-marker',
          html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <span class="text-white text-xl">🐾</span>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([animal.lastSeenLat, animal.lastSeenLng], { icon: markerIcon })
          .addTo(mapRef.current!);

        marker.bindPopup(`
          <div class="p-3">
            <h3 class="font-semibold text-base">${animal.name}</h3>
            <p class="text-sm text-gray-600">${animal.species}</p>
            <p class="text-xs mt-1">${animal.lastSeenLocation || 'Unknown location'}</p>
            ${animal.lastSeenAt ? `<p class="text-xs text-gray-500 mt-1">${new Date(animal.lastSeenAt).toLocaleString()}</p>` : ''}
          </div>
        `);

        markers.push(marker);

        // Add 2km radius circle
        const circle = L.circle([animal.lastSeenLat, animal.lastSeenLng], {
          color: '#fb923c',
          fillColor: '#fb923c',
          fillOpacity: 0.1,
          radius: 2000, // 2km in meters
        }).addTo(mapRef.current!);
        circles.push(circle);
      }
    });

    return () => {
      markers.forEach(m => m.remove());
      circles.forEach(c => c.remove());
    };
  }, [animals, showAnimals]);

  const activeAnimals = animals.filter(a => a.lastSeenLat && a.lastSeenLng);
  const onlineCameras = CAMERA_LOCATIONS.filter(c => c.status === 'online' || c.status === 'alert').length;
  const criticalAlerts = CAMERA_LOCATIONS.filter(c => c.threat).length;

  return (
    <div className="h-screen flex flex-col p-6 space-y-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 font-quicksand">
            <TreePine className="h-10 w-10 text-primary" />
            Live Forest Surveillance
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary/70" />
            Real-time camera feeds and animal tracking across Tadoba
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showCameras ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCameras(!showCameras)}
            className={showCameras ? "glass-button" : ""}
          >
            <Camera className="h-4 w-4 mr-2" />
            Cameras
          </Button>
          <Button
            variant={showAnimals ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnimals(!showAnimals)}
            className={showAnimals ? "glass-button" : ""}
          >
            <PawPrint className="h-4 w-4 mr-2" />
            Animals
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard strength="medium" animated>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Online Cameras</p>
              <p className="text-2xl font-bold">{onlineCameras}/12</p>
            </div>
            <Camera className="h-8 w-8 text-primary" />
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-500">{criticalAlerts}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Animals Tracked</p>
              <p className="text-2xl font-bold">{activeAnimals.length}</p>
            </div>
            <PawPrint className="h-8 w-8 text-primary" />
          </CardContent>
        </GlassCard>

        <GlassCard strength="medium" animated>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coverage</p>
              <p className="text-2xl font-bold">18 km²</p>
            </div>
            <MapPin className="h-8 w-8 text-primary" />
          </CardContent>
        </GlassCard>
      </div>

      {/* Map Container */}
      <div className="flex-1 rounded-lg overflow-hidden shadow-2xl relative">
        <div ref={mapContainerRef} className="w-full h-full" data-testid="map-container" />
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <GlassCard strength="strong">
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-xs">Camera Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs">Threat Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span className="text-xs">Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span className="text-xs">Animal Tracker</span>
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Selected Camera Info */}
        {selectedCamera && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-4 z-[1000] w-80"
          >
            <GlassCard strength="strong">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Camera {selectedCamera.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCamera(null)}
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-semibold">{selectedCamera.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCamera.lat.toFixed(4)}°N, {selectedCamera.lng.toFixed(4)}°E
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Detection</p>
                  <p className={`text-sm font-medium ${selectedCamera.threat ? 'text-red-500' : ''}`}>
                    {selectedCamera.lastDetection}
                  </p>
                </div>
                <Badge className={
                  selectedCamera.threat ? 'bg-red-500' :
                  selectedCamera.status === 'maintenance' ? 'bg-gray-500' :
                  'bg-green-500'
                }>
                  {selectedCamera.status.toUpperCase()}
                </Badge>
              </CardContent>
            </GlassCard>
          </motion.div>
        )}
      </div>

      <style>{`
        .map-tiles {
          filter: brightness(0.95) saturate(1.1);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }
        .custom-camera-marker, .custom-animal-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
