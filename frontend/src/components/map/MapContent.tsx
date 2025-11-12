import { useEffect, useState } from 'react';
import { TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Bus, Stop } from '@/types';
import { useSocket, LocationUpdate } from '@/hooks/useSocket';
import { RoutePolyline } from './MapView';

interface MapContentProps {
  buses: Bus[];
  stops?: Stop[];
  routes?: RoutePolyline[];
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

// Decode Google's polyline encoding format
// Reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
function decodePolyline(encoded: string): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// MapContent component that handles dynamic content
export const MapContent: React.FC<MapContentProps> = ({ buses, stops = [], routes, routePath, onBusClick }) => {
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

      {/* Render route polylines */}
      {routes?.map((route) => {
        if (!route.polyline) return null;
        try {
          const decodedPath = decodePolyline(route.polyline);
          return (
            <Polyline
              key={`route-${route.id}`}
              positions={decodedPath}
              color={route.color || '#007bff'}
              weight={3}
              opacity={0.7}
              dashArray="5, 5"
            />
          );
        } catch (e) {
          console.error(`Failed to decode polyline for route ${route.id}:`, e);
          return null;
        }
      })}
      
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