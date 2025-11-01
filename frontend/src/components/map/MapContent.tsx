import { useEffect, useState } from 'react';
import { TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Bus, Stop } from '@/types';
import { useSocket, LocationUpdate } from '@/hooks/useSocket';

interface MapContentProps {
  buses: Bus[];
  stops?: Stop[];
  routePath?: Array<[number, number]>;
  onBusClick?: (bus: Bus) => void;
}

const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// MapContent component that handles dynamic content
export const MapContent: React.FC<MapContentProps> = ({ buses, stops = [], routePath, onBusClick }) => {
  const [busPositions, setBusPositions] = useState<Map<string, { lat: number; lng: number }>>(
    new Map((Array.isArray(buses) ? buses : []).map(bus => [bus.id, { lat: bus.current_lat, lng: bus.current_lng }]))
  );
  const { onLocationUpdate } = useSocket();
  const map = useMap();

  // Handle real-time updates
  useEffect(() => {
    const cleanup = onLocationUpdate((data: LocationUpdate) => {
      setBusPositions(prev => {
        const newPositions = new Map(prev);
        newPositions.set(data.busId, {
          lat: data.latitude,
          lng: data.longitude,
        });
        return newPositions;
      });
    });
    return cleanup;
  }, [onLocationUpdate]);

  // Update initial positions when buses prop changes
  useEffect(() => {
    if (!Array.isArray(buses)) return;
    setBusPositions(
      new Map(buses.map(bus => [bus.id, { lat: bus.current_lat, lng: bus.current_lng }]))
    );
  }, [buses]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {stops?.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.latitude, stop.longitude]}
          icon={DefaultIcon}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold">{stop.stop_name}</h4>
              <p className="text-sm text-gray-600">Stop #{stop.stop_order}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {buses.map((bus) => {
        const position = busPositions.get(bus.id) || {
          lat: bus.current_lat,
          lng: bus.current_lng,
        };
        return (
          <Marker
            key={bus.id}
            position={[position.lat, position.lng]}
            icon={DefaultIcon}
            eventHandlers={{
              click: () => onBusClick?.(bus)
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold">{bus.bus_number}</h4>
                <p className="text-sm text-gray-600">{bus.current_state}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};