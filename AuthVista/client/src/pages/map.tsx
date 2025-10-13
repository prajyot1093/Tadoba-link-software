import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Animal } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { PawPrint } from "lucide-react";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map centered on Tadoba
    const map = L.map(mapContainerRef.current).setView([20.2347, 79.3401], 12);

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

  useEffect(() => {
    if (!mapRef.current || animals.length === 0) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        layer.remove();
      }
    });

    // Add animal markers
    animals.forEach((animal) => {
      if (animal.lastSeenLat && animal.lastSeenLng && mapRef.current) {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="w-10 h-10 bg-primary rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse-ring">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.5 13.5l2.5 3 3.5-3.5L12 10l-3.5 3.5z"/>
            </svg>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([animal.lastSeenLat, animal.lastSeenLng], { icon: markerIcon })
          .addTo(mapRef.current);

        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${animal.name}</h3>
            <p class="text-xs text-gray-600">${animal.species}</p>
            <p class="text-xs mt-1">${animal.lastSeenLocation || 'Unknown location'}</p>
            ${animal.lastSeenAt ? `<p class="text-xs text-gray-500 mt-1">${new Date(animal.lastSeenAt).toLocaleString()}</p>` : ''}
          </div>
        `);

        // Add 2km radius circle
        L.circle([animal.lastSeenLat, animal.lastSeenLng], {
          color: '#fb923c',
          fillColor: '#fb923c',
          fillOpacity: 0.1,
          radius: 2000, // 2km in meters
        }).addTo(mapRef.current);
      }
    });
  }, [animals]);

  const activeAnimals = animals.filter(a => a.lastSeenLat && a.lastSeenLng);

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Animal Tracker</h1>
            <p className="text-muted-foreground mt-1">Real-time wildlife location monitoring</p>
          </div>
          <Card className="px-4 py-2 bg-card/50 backdrop-blur-sm border-card-border">
            <div className="flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{activeAnimals.length}</p>
                <p className="text-xs text-muted-foreground">Active Trackers</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div ref={mapContainerRef} className="flex-1 relative" data-testid="map-container">
        {activeAnimals.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000] pointer-events-none">
            <div className="text-center">
              <PawPrint className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No Active Trackers</p>
              <p className="text-sm text-muted-foreground">Add animal location data to see them on the map</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .map-tiles {
          filter: brightness(0.9) saturate(0.8) hue-rotate(-10deg);
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
