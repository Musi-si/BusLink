import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { Bus, Stop } from '@/types';
import { MapContent } from './MapContent';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  buses: Bus[];
  stops?: Stop[];
  routePath?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  onBusClick?: (bus: Bus) => void;
}

export function MapView({
  buses,
  stops,
  routePath,
  onBusClick,
}: MapViewProps) {
  // const mapStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

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
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapContent 
          buses={buses} 
          stops={stops} 
          routePath={routePath} 
          onBusClick={onBusClick}
        />
      </MapContainer>
    </div>
  );
}