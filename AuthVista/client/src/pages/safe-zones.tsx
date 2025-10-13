import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { SafeZone, Animal } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Shield, AlertTriangle } from "lucide-react";

export default function SafeZones() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { data: safeZones = [] } = useQuery<SafeZone[]>({
    queryKey: ["/api/safe-zones"],
  });

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ["/api/animals"],
  });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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
    if (!mapRef.current) return;

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Circle || layer instanceof L.Marker) {
        layer.remove();
      }
    });

    // Add safe zones
    safeZones.forEach((zone) => {
      if (zone.coordinates && mapRef.current) {
        const coords = zone.coordinates as any[];
        if (Array.isArray(coords) && coords.length > 0) {
          L.polygon(coords as [number, number][], {
            color: '#4ade80',
            fillColor: '#4ade80',
            fillOpacity: 0.3,
            weight: 2,
          }).addTo(mapRef.current).bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm flex items-center gap-2">
                <span class="text-green-600">✓</span> ${zone.name}
              </h3>
              <p class="text-xs text-gray-600 mt-1">${zone.description || 'Safe grazing area'}</p>
              ${zone.area ? `<p class="text-xs text-gray-500 mt-1">Area: ${zone.area}</p>` : ''}
            </div>
          `);
        }
      }
    });

    // Add animal markers (danger zones)
    animals.forEach((animal) => {
      if (animal.lastSeenLat && animal.lastSeenLng && animal.status === 'active' && mapRef.current) {
        const markerIcon = L.divIcon({
          className: 'custom-danger-marker',
          html: `<div class="w-8 h-8 bg-destructive rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([animal.lastSeenLat, animal.lastSeenLng], { icon: markerIcon })
          .addTo(mapRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm text-red-600">⚠️ ${animal.name}</h3>
              <p class="text-xs text-gray-600">${animal.species}</p>
              <p class="text-xs mt-1">${animal.lastSeenLocation || 'Unknown location'}</p>
              <p class="text-xs text-red-500 font-medium mt-1">Stay away from this area!</p>
            </div>
          `);

        // Danger radius
        L.circle([animal.lastSeenLat, animal.lastSeenLng], {
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          radius: 2000,
        }).addTo(mapRef.current);
      }
    });
  }, [safeZones, animals]);

  const activeZones = safeZones.filter(z => z.isActive);
  const nearbyAnimals = animals.filter(a => a.status === 'active' && a.lastSeenLat);

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Safe Grazing Zones</h1>
            <p className="text-muted-foreground mt-1">Protected areas for cattle with minimal wildlife activity</p>
          </div>
          <div className="flex gap-3">
            <Card className="px-4 py-2 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{activeZones.length}</p>
                  <p className="text-xs text-muted-foreground">Safe Zones</p>
                </div>
              </div>
            </Card>
            <Card className="px-4 py-2 bg-destructive/5 border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">{nearbyAnimals.length}</p>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div ref={mapContainerRef} className="flex-1 relative" data-testid="safe-zones-map">
        {activeZones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000] pointer-events-none">
            <div className="text-center">
              <Shield className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">No Safe Zones Defined</p>
              <p className="text-sm text-muted-foreground">Contact the forest department for safe grazing areas</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/30 border-2 border-primary rounded" />
            <span className="text-muted-foreground">Safe Grazing Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-destructive/30 border-2 border-destructive rounded-full" />
            <span className="text-muted-foreground">Wildlife Alert (2km radius)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-muted-foreground">Animal Location</span>
          </div>
        </div>
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
