import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Bus } from '@/types';
import { MapView } from '@/components/map/MapView';
import { RouteList } from '@/components/routes/RouteList';
import { BusInfoPanel } from '@/components/bus/BusInfoPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const HomePage = () => {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  const { data: buses = [] } = useQuery({
    queryKey: ['active-buses'],
    queryFn: async () => {
      const response = await axiosInstance.get<Bus[]>('/api/buses/active');
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] relative">
      {/* Mobile Route List */}
      <div className="absolute top-4 left-4 z-[1000] md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="secondary" className="shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Routes</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <RouteList />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Route List Sidebar */}
      <aside className="hidden md:block w-80 border-r bg-card overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Routes</h2>
          <RouteList />
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          buses={Array.isArray(buses) ? buses : []}
          onBusClick={setSelectedBus}
        />

        {/* Bus Info Panel */}
        {selectedBus && (
          <div className="absolute bottom-4 right-4 w-80 z-[1000] max-h-[60vh] overflow-y-auto">
            <BusInfoPanel bus={selectedBus} onClose={() => setSelectedBus(null)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
