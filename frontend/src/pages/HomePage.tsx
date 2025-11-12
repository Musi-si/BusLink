import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Bus } from '@/types';
import { MapView } from '@/components/map/MapView';
import { RouteList } from '@/components/routes/RouteList';
import { RouteDetailsDialog } from '@/components/routes/RouteDetailsDialog';
import { BusInfoPanel } from '@/components/bus/BusInfoPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

function DashboardShortcut() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return null;

  const to = (() => {
    switch (user?.role) {
      case 'driver':
        return '/driver/dashboard';
      case 'admin':
        return '/dashboard/admin';
      case 'passenger':
        return '/dashboard/passenger';
      default:
        return '/';
    }
  })();

  return (
    <div className="mb-4">
      <Button variant="default" size="sm" asChild className="w-full justify-cennter">
        <Link to={to}>Go to Dashboard</Link>
      </Button>
    </div>
  );
}

const HomePage = () => {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);

  const { data: buses = [] } = useQuery({
    queryKey: ['active-buses'],
    queryFn: async () => {
      const response = await axiosInstance.get<Bus[]>('/api/buses/active');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all routes with their polylines and colors
  const { data: routesData = [] } = useQuery({
    queryKey: ['routes-with-polylines'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/routes');
      // backend returns { success, data: [...], pagination }
      return response.data.data as any[];
    },
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Mobile Route List */}
      <div className="absolute top-4 left-4 z-[1000] md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Menu className="h-5 w-3" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
              <DashboardShortcut />
              <SheetHeader>
                <SheetTitle>Routes</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <RouteList onSelectRoute={setSelectedRoute} />
              </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Route List Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-card overflow-y-auto">
        <div className="p-4">
          {/* Dashboard shortcut shown only when user is authenticated - placed above routes list */}
          <DashboardShortcut />
          <h2 className="text-xl font-bold mb-4">Routes</h2>
          <RouteList onSelectRoute={setSelectedRoute} />
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          buses={Array.isArray(buses) ? buses : []}
          routes={Array.isArray(routesData) ? routesData : []}
          onBusClick={setSelectedBus}
        />

        {/* Bus Info Panel */}
        {selectedBus && (
          <div className="absolute bottom-4 right-4 w-80 z-[1000] max-h-[60vh] overflow-y-auto">
            <BusInfoPanel bus={selectedBus} onClose={() => setSelectedBus(null)} />
          </div>
        )}
      </div>

      {/* Route Details Dialog - rendered at top level to appear above map */}
      <RouteDetailsDialog open={!!selectedRoute} onClose={() => setSelectedRoute(null)} route={selectedRoute} />
    </div>
  );
};

export default HomePage;
