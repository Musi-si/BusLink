import { useState, useRef, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

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
      const b = response.data.data as any;
      // Backend returns camelCase names (Prisma model): busNumber, vehiclePlate, lastLocationLat, lastLocationLng, lastSpeedKmh
      // Map to the frontend's expected shape used across this page for minimal changes.
      const mapped = {
        id: b.id,
        bus_number: b.busNumber || b.bus_number || b.bus_number,
        vehicle_plate: b.vehiclePlate || b.vehicle_plate,
        vehicle_model: b.vehicleModel || b.vehicle_model,
        capacity: b.capacity ?? 30,
        current_lat: b.lastLocationLat ?? b.current_lat ?? 0,
        current_lng: b.lastLocationLng ?? b.current_lng ?? 0,
        speed_kmh: Number(b.lastSpeedKmh ?? b.speed_kmh ?? 0) || 0,
        status: b.status,
        route: b.route,
        driver: b.driver,
        // keep original for any downstream needs
        _raw: b,
      } as unknown as BusWithRelations;

      return mapped;
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
  const { toast } = useToast();

  // Detect whether geolocation is available/allowed in the browser.
  // null = unknown, true = available, false = unavailable/denied
  const [gpsAvailable, setGpsAvailable] = useState<boolean | null>(null);
  // Allow ops/dev to enable manual location via env flag
  const manualEnabled = (import.meta.env.VITE_ENABLE_MANUAL_LOCATION === 'true');

  // GPS tracking state
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const lastPositionRef = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const lastSmoothedSpeedRef = useRef<number | null>(null);

  // Helper: Haversine distance in meters
  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // EMA smoothing
  const ema = (prev: number | null, curr: number, alpha = 0.3) => {
    if (prev === null || prev === undefined) return curr;
    return alpha * curr + (1 - alpha) * prev;
  };

  // Helper to send a location update to the backend
  async function sendLocationUpdate(lat: number, lng: number, speed?: number) {
    try {
      await axiosInstance.patch('/api/driver/update-location', {
        bus_number: assignedBus?.bus_number,
        current_lat: lat,
        current_lng: lng,
        speed_kmh: speed ?? 0,
        source: 'gps',
      });
    } catch (err) {
      // swallow here; UI may surface errors if needed
      // console.error('Failed to send location update', err);
    }
  }

  function startTracking() {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation unavailable', description: 'Geolocation is not supported by your browser. You can update location manually.', variant: 'destructive' });
      setGpsAvailable(false);
      return;
    }

    // Ask for permission and start watching position
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const timestamp = pos.timestamp || now;

        // Device-provided speed in m/s -> km/h when available
        let deviceSpeedKmh: number | null = null;
        if (typeof pos.coords.speed === 'number' && !Number.isNaN(pos.coords.speed) && pos.coords.speed > 0) {
          deviceSpeedKmh = pos.coords.speed * 3.6;
        }

        // Compute speed from previous fix
        let computedSpeedKmh = 0;
        if (lastPositionRef.current) {
          const prev = lastPositionRef.current;
          const dt = (timestamp - prev.t) / 1000; // seconds
          const distM = haversineMeters(prev.lat, prev.lng, lat, lng);
          if (dt >= 1 && distM >= 3) {
            const speedMs = distM / dt;
            computedSpeedKmh = speedMs * 3.6;
          } else {
            computedSpeedKmh = 0;
          }
        }

        // Choose device speed when available and reasonable, otherwise computed
        const rawSpeed = (deviceSpeedKmh && deviceSpeedKmh > 0.5) ? deviceSpeedKmh : computedSpeedKmh;
        // Clamp plausible range
        const clamped = Math.max(0, Math.min(rawSpeed, 200));
        // Smooth
        const smoothed = ema(lastSmoothedSpeedRef.current, clamped, 0.35);
        lastSmoothedSpeedRef.current = smoothed;

        // Update last position for next computation
        lastPositionRef.current = { lat, lng, t: timestamp };

        // Throttle sending to server (every ~3s)
        if (now - lastSentRef.current >= 3000) {
          lastSentRef.current = now;
          // send rounded smoothed speed
          const speedToSend = Math.round(smoothed * 10) / 10;
          void sendLocationUpdate(lat, lng, speedToSend);
          // update UI by refetch
          void queryClient.invalidateQueries({ queryKey: ['my-assigned-bus'] });
        }
      },
      (err) => {
        // permission denied or other errors
        console.error('Geolocation error', err);
        setGpsAvailable(false);
        toast({ title: 'Unable to access location', description: 'Please enable location services and try again. You can update location manually as a fallback.', variant: 'destructive' });
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    watchIdRef.current = id as unknown as number;
    setIsTracking(true);
  }

  function stopTracking() {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsTracking(false);
  }

  // cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  <div className="flex items-center gap-2">
                    {(manualEnabled || gpsAvailable === false) && (
                      <Button onClick={() => setIsLocationDialogOpen(true)} size="sm">Update Location</Button>
                    )}
                    {isTracking ? (
                      <Button size="sm" variant="destructive" onClick={() => stopTracking()}>Stop Tracking</Button>
                    ) : (
                      <Button size="sm" onClick={() => startTracking()}>Start Trip</Button>
                    )}
                  </div>
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
                    <p className="font-medium">{(Number(assignedBus.speed_kmh) || 0).toFixed(1)} km/h</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Current Location</p>
                    <p className="font-medium">{(Number(assignedBus.current_lat) || 0).toFixed(4)}, {(Number(assignedBus.current_lng) || 0).toFixed(4)}</p>
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
