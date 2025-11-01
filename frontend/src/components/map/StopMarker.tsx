import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Stop } from '@/types';
import { renderToString } from 'react-dom/server';

interface StopMarkerProps {
  stop: Stop;
}

export const StopMarker = ({ stop }: StopMarkerProps) => {
  const position: [number, number] = [stop.latitude, stop.longitude];
  
  const icon = L.divIcon({
    html: renderToString(
      <div className="relative flex items-center justify-center">
        <div 
          className="rounded-full p-1.5 shadow-md border-2 border-white"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    ),
    className: 'stop-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <Marker 
      position={position}
      icon={icon}
    >
      <Popup>
        <div className="p-2">
          <h4 className="font-bold text-sm">{stop.stop_name}</h4>
          <p className="text-xs text-muted-foreground">Stop #{stop.stop_order}</p>
        </div>
      </Popup>
    </Marker>
  );
};
