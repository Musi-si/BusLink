import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { BusWithRelations, TripWithRelations, BookingWithRelations } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus as BusIcon, MapPin, Activity, Users, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UpdateBusLocationDialog } from '@/components/driver/UpdateBusLocationDialog';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { UpdatePhoneDialog } from '@/components/auth/UpdatePhoneDialog';

const DriverDashboardPage = () => {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<'trips' | 'bookings' | 'bus' | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);

  const { data: assignedBus, isLoading: busLoading } = useQuery({
    // Query key identifies this specific data fetch.
    queryKey: ['my-assigned-bus'],
    // queryFn is the async function that fetches the data.
    queryFn: async () => {
      // CORRECT ENDPOINT: Fetches the single bus assigned to the authenticated driver.
      const response = await axiosInstance.get('/api/driver/my-bus');
      // The actual data is nested in `response.data.data`.
      return response.data.data as BusWithRelations; 
    },
    // This query will only run if a user is logged in and their role is 'driver'.
    enabled: !!user && user.role === 'driver',
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ['my-driver-trips'],
    queryFn: async () => {
      // CORRECT ENDPOINT: Fetches trips for the authenticated driver. No ID in the URL.
      const response = await axiosInstance.get('/api/driver/trips');
      // Sort the data on the client-side after fetching.
      const tripsData = response.data.data as TripWithRelations[];
      return tripsData.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    },
    enabled: !!user && user.role === 'driver',
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bus-bookings'],
    queryFn: async () => {
      // CORRECT ENDPOINT: Fetches bookings for the driver's currently assigned bus.
      const response = await axiosInstance.get('/api/driver/my-bus/bookings');
      return response.data.data as BookingWithRelations[];
    },
    enabled: !!user && user.role === 'driver',
  });

  if (busLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!assignedBus) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <BusIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-semibold mb-2">No bus assignment found</p>
          <p className="text-muted-foreground">
            You don't have a bus assigned yet. Contact your supervisor.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'moving':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'maintenance':
      case 'offline':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const tripCount = Array.isArray(trips) ? trips.length : 0;
  const bookingCount = Array.isArray(bookings) ? bookings.length : 0;

  // Make sure you also import `useQueryClient` at the top:
  // import { useQuery, useQueryClient } from '@tanstack/react-query';

  const queryClient = useQueryClient();

  function refetchAssignedBus() {
    // Invalidate the assigned-bus query so react-query will refetch it.
    return queryClient.invalidateQueries({ queryKey: ['my-assigned-bus'] });
  }

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="flex items-start gap-6">
        {/* Left floating profile panel */}
        <aside className="w-full max-w-xs sticky top-20 self-start">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <BusIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Profile</div>
                  <div className="font-semibold text-sm">{user?.name || user?.email}</div>
                </div>
              </div>
              <button aria-label="notifications" className="p-2 rounded-md hover:bg-muted">
                <MapPin className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm text-muted-foreground mb-2">Profile Information</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Name</div>
                <div className="font-medium text-sm">{user?.name || 'Not set'}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{user?.phone || 'Not set'}</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsPhoneDialogOpen(true)}
                  >
                    Update
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">License</div>
                <div className="font-medium text-sm">{user?.license || 'Not set'}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Vehicle Plate</div>
                <div className="font-medium text-sm">{user?.plate || 'Not set'}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Password</div>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">********</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsPasswordDialogOpen(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">Driver Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'trips' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('trips')}>
              <div>
                <div className="text-sm text-muted-foreground">Trips</div>
                <div className="text-2xl font-bold">{tripsLoading ? '—' : tripCount}</div>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'bookings' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('bookings')}>
              <div>
                <div className="text-sm text-muted-foreground">Bookings on Bus</div>
                <div className="text-2xl font-bold">{bookingsLoading ? '—' : bookingCount}</div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'bus' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('bus')}>
              <div>
                <div className="text-sm text-muted-foreground">Assigned Bus</div>
                <div className="text-2xl font-bold">{assignedBus.bus_number}</div>
              </div>
              <BusIcon className="h-8 w-8 text-primary" />
            </Card>
          </div>

          {/* Detail tables */}
          <div className="space-y-6">
            {selected === null && (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Select a card above to view details and actions.</p>
              </Card>
            )}

            {selected === 'trips' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Trips (latest first)</h2>
                </div>

                <div className="overflow-auto">
                  {tripsLoading ? (
                    <div className="text-sm text-muted-foreground p-4">Loading...</div>
                  ) : !trips || trips.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No trips found.</div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-2">Date</th>
                          <th className="p-2">Route</th>
                          <th className="p-2">Distance (km)</th>
                          <th className="p-2">Duration (mins)</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((t: any) => (
                          <tr key={t.id} className="border-t">
                            <td className="p-2">{new Date(t.created_at).toLocaleString()}</td>
                            <td className="p-2">{t.route?.route_name || 'N/A'}</td>
                            <td className="p-2">{t.distance_km}</td>
                            <td className="p-2">{t.duration_mins}</td>
                            <td className="p-2">{t.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}

            {selected === 'bookings' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Bookings on Your Bus</h2>
                </div>

                <div className="overflow-auto">
                  {bookingsLoading ? (
                    <div className="text-sm text-muted-foreground p-4">Loading...</div>
                  ) : !bookings || bookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No bookings found for your bus.</div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-2">Passenger</th>
                          <th className="p-2">Seats</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((b: any) => (
                          <tr key={b.id} className="border-t">
                            <td className="p-2">{b.user?.name || b.user?.email || 'N/A'}</td>
                            <td className="p-2">{b.seats}</td>
                            <td className="p-2">{new Date(b.created_at).toLocaleString()}</td>
                            <td className="p-2">{b.status}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm">View</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}

            {selected === 'bus' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Assigned Bus Details</h2>
                  <Button onClick={() => setIsLocationDialogOpen(true)} size="sm">Update Location</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Bus Number</p>
                    <p className="font-medium">{assignedBus.bus_number}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-medium">{assignedBus.capacity}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Current Speed</p>
                    <p className="font-medium">{assignedBus.speed_kmh.toFixed(1)} km/h</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Current Location</p>
                    <p className="font-medium">{assignedBus.current_lat.toFixed(4)}, {assignedBus.current_lng.toFixed(4)}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UpdateBusLocationDialog
        open={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        busNumber={assignedBus.bus_number}
        initialLat={assignedBus.current_lat}
        initialLng={assignedBus.current_lng}
        initialSpeed={assignedBus.speed_kmh}
        onSuccess={() => void refetchAssignedBus()}
      />

      <ChangePasswordDialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      />

      <UpdatePhoneDialog
        open={isPhoneDialogOpen}
        onOpenChange={setIsPhoneDialogOpen}
      />
    </div>
  );
};

export default DriverDashboardPage;
