import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Bus, Stop } from '@/types';
import { MapContent } from './MapContent';
import MapSearch from './MapSearch';
import { useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RoutePolyline {
  id: number;
  name: string;
  polyline?: string;
  color?: string;
}

interface MapViewProps {
  buses: Bus[];
  stops?: Stop[];
  routes?: RoutePolyline[];
  routePath?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  onBusClick?: (bus: Bus) => void;
}

export function MapView({
  buses,
  stops,
  routes,
  routePath,
  onBusClick,
}: MapViewProps) {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const goToLocation = (lat: number, lon: number, zoom = 15) => {
    if (!map) return;
    map.flyTo([lat, lon], zoom);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[-1.9441, 30.0619]}
        zoom={13}
        minZoom={12}
        maxZoom={16}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        // zoomControl={true}
        maxBounds={[
          [-2.1, 29.9], // southwest
          [-1.8, 30.2], // northeast
        ]}
        whenCreated={(m) => setMap(m)}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapContent 
          buses={buses} 
          stops={stops}
          routes={routes}
          routePath={routePath} 
          onBusClick={onBusClick}
        />
      </MapContainer>

      {/* Search overlay - placed above the map */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999]">
        <MapSearch onSelect={(lat, lon) => goToLocation(lat, lon, 15)} />
      </div>
    </div>
  );
}