import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Route } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const RouteList = () => {
  const navigate = useNavigate();

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await axiosInstance.get<Route[]>('/api/routes');
      return response.data;
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
      {Array.isArray(routes) && routes.map((route) => (
        <Card key={route.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg text-primary">
                  {route.route_number}
                </span>
                <span className="text-sm font-medium">{route.route_name}</span>
                {route.active && (
                  <Activity className="h-4 w-4 text-success ml-auto" />
                )}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{route.start_location} → {route.end_location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{route.estimated_duration_min} min · {route.total_distance_km} km</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3"
            onClick={() => navigate(`/routes/${route.id}`)}
          >
            View Details
          </Button>
        </Card>
      ))}
    </div>
  );
};
