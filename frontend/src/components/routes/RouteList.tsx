import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Route } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import RouteDetailsDialog from './RouteDetailsDialog';
import { useState } from 'react';

export const RouteList = () => {
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/routes');
      // backend returns { success, data: [...], pagination }
      return response.data.data as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No routes available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.isArray(routes) && routes.map((route: any) => (
        <>
        <Card key={route.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg text-primary">{route.name}</span>
                {route.activeBusesCount > 0 && (
                  <Activity className="h-4 w-4 text-success ml-auto" />
                )}
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {/* derive start/end from name if possible */}
                  <span>{(route.name || '').split(' - ')[0] || 'N/A'} → {(route.name || '').split(' - ')[1] || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{route.estimatedDurationMinutes ?? route.estimated_duration_min ?? 'N/A'} min · {route.distanceKm ?? route.total_distance_km ?? 'N/A'} km</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={() => setSelectedRoute(route)}
          >
            View Details
          </Button>
        </Card>
        </>
      ))}

      <RouteDetailsDialog open={!!selectedRoute} onClose={() => setSelectedRoute(null)} route={selectedRoute} />
    </div>
  );
};
