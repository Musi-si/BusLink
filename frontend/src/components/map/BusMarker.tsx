import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Bus } from '@/types';
import { renderToString } from 'react-dom/server';

interface BusMarkerProps {
  bus: Bus;
  position: [number, number];
  onClick?: () => void;
}

const getBusColor = (state: string) => {
  switch (state) {
    case 'moving':
      return '#39533C'; // military green
    case 'idle':
      return '#f59e0b'; // amber
    case 'maintenance':
    case 'offline':
      return '#6b7280'; // gray
    default:
      return '#39533C';
  }
};

export const BusMarker = ({ bus, position, onClick }: BusMarkerProps) => {
  const color = getBusColor(bus.current_state);
  
  const icon = L.divIcon({
    html: renderToString(
      <div className="relative flex items-center justify-center">
        <div 
          className="rounded-full p-2 shadow-lg transition-all hover:scale-110"
          style={{ backgroundColor: color }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 6v6" />
            <path d="M15 6v6" />
            <path d="M2 12h19.6" />
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
            <circle cx="7" cy="18" r="2" />
            <circle cx="17" cy="18" r="2" />
          </svg>
        </div>
        <div 
          className="absolute -top-1 -right-1 bg-white text-xs font-bold rounded-full px-1 shadow"
          style={{ color: color }}
        >
          {bus.bus_number}
        </div>
      </div>
    ),
    className: 'bus-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker 
      position={position}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-bold text-lg mb-2">Bus {bus.bus_number}</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="capitalize">{bus.current_state}</span>
            </p>
            <p>
              <span className="font-medium">Speed:</span> {bus.speed_kmh.toFixed(1)} km/h
            </p>
            {bus.route && (
              <p>
                <span className="font-medium">Route:</span> {bus.route.route_name}
              </p>
            )}
            <p>
              <span className="font-medium">Capacity:</span> {bus.capacity} seats
            </p>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
