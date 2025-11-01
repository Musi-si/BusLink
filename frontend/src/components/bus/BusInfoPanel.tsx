import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Bus, BusProgress } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BusInfoPanelProps {
  bus: Bus;
  onClose?: () => void;
}

export const BusInfoPanel = ({ bus }: BusInfoPanelProps) => {
  const { data: progress, isLoading } = useQuery({
    queryKey: ['bus-progress', bus.id],
    queryFn: async () => {
      const response = await axiosInstance.get<BusProgress>(`/api/buses/${bus.id}/progress`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'moving':
        return 'success';
      case 'idle':
        return 'warning';
      case 'maintenance':
      case 'offline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xl">Bus {bus.bus_number}</h3>
            {bus.route && (
              <p className="text-sm text-muted-foreground">{bus.route.route_name}</p>
            )}
          </div>
          <Badge variant={getStatusColor(bus.current_state)}>
            {bus.current_state}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Speed</p>
              <p className="font-medium">{bus.speed_kmh.toFixed(1)} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Capacity</p>
              <p className="font-medium">{bus.capacity} seats</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : progress && progress.etas && progress.etas.length > 0 ? (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Upcoming Stops
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {progress.etas.slice(0, 5).map((eta) => (
                <div
                  key={eta.stopId}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{eta.stopName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(eta.distanceMeters / 1000).toFixed(1)} km away
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(eta.estimatedArrival).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No ETA data available
          </p>
        )}
      </div>
    </Card>
  );
};
