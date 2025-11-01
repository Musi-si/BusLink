import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Route } from '@/types';
import { MapView } from '@/components/map/MapView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, Activity } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { Skeleton } from '@/components/ui/skeleton';

const RouteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { subscribeToRoute, unsubscribeFromRoute } = useSocket();

  const { data: route, isLoading } = useQuery({
    queryKey: ['route', id],
    queryFn: async () => {
      const response = await axiosInstance.get<Route>(`/api/routes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      subscribeToRoute(id);
      return () => unsubscribeFromRoute(id);
    }
  }, [id, subscribeToRoute, unsubscribeFromRoute]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] p-4">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Route not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const routePath = route.stops
    ?.sort((a, b) => a.stop_order - b.stop_order)
    .map(stop => [stop.latitude, stop.longitude] as [number, number]);

  const centerPoint = route.stops && route.stops.length > 0
    ? [route.stops[0].latitude, route.stops[0].longitude] as [number, number]
    : undefined;

  return (
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Info Sidebar */}
      <aside className="w-80 border-r bg-card overflow-y-auto">
        <div className="p-4 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Map
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-2xl text-primary">{route.route_number}</span>
              {route.active && <Badge variant="default">Active</Badge>}
            </div>
            <h1 className="font-bold text-xl mb-1">{route.route_name}</h1>
          </div>

          <Card className="p-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">{route.start_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">To</p>
                  <p className="font-medium">{route.end_location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{route.estimated_duration_min} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-muted-foreground">Distance</p>
                  <p className="font-medium">{route.total_distance_km} km</p>
                </div>
              </div>
            </div>
          </Card>

          {route.stops && route.stops.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Stops ({route.stops.length})</h3>
              <div className="space-y-2">
                {route.stops
                  .sort((a, b) => a.stop_order - b.stop_order)
                  .map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{stop.stop_name}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {route.buses && route.buses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Active Buses ({route.buses.length})</h3>
              <div className="space-y-2">
                {route.buses.map((bus) => (
                  <Card key={bus.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">Bus {bus.bus_number}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {bus.current_state}
                        </p>
                      </div>
                      <Badge variant="outline">{bus.speed_kmh.toFixed(0)} km/h</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1">
        <MapView
          buses={Array.isArray(route.buses) ? route.buses : route.buses || []}
          stops={route.stops}
          routePath={routePath}
          center={centerPoint}
          zoom={13}
        />
      </div>
    </div>
  );
};

export default RouteDetailPage;
