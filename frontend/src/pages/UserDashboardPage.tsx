import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Truck, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { UpdatePhoneDialog } from '@/components/auth/UpdatePhoneDialog';

type SelectedView = 'bookings' | 'routes' | 'buses' | null;

const UserDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedView>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/bookings/user/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const { data: availableRoutes, isLoading: routesLoading } = useQuery({
    queryKey: ['available-routes'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/routes/available');
      return res.data;
    },
    enabled: selected === 'routes',
  });

  const { data: availableBuses, isLoading: busesLoading } = useQuery({
    queryKey: ['available-buses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/api/buses/available');
      return res.data;
    },
    enabled: selected === 'buses',
  });

  const bookingCount = Array.isArray(bookings) ? bookings.length : 0;

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="flex items-start gap-6">
        {/* Left floating profile panel */}
        <aside className="w-full max-w-xs sticky top-20 self-start">
          <div className="bg-card p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Profile</div>
                  <div className="font-semibold text-sm">{user?.name || user?.email}</div>
                </div>
              </div>
              <button aria-label="notifications" className="p-2 rounded-md hover:bg-muted">
                <Bell className="h-5 w-5" />
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
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium text-sm">{user?.email}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Role</div>
                <div className="font-medium text-sm">{user?.role}</div>
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
          <h1 className="text-3xl font-bold mb-4">Your Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'bookings' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('bookings')}>
              <div>
                <div className="text-sm text-muted-foreground">Your Bookings</div>
                <div className="text-2xl font-bold">{bookingsLoading ? '—' : bookingCount}</div>
              </div>
              <CalendarDays className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'routes' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('routes')}>
              <div>
                <div className="text-sm text-muted-foreground">Available Routes</div>
                <div className="text-2xl font-bold">{routesLoading ? '—' : (Array.isArray(availableRoutes) ? availableRoutes.length : 0)}</div>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'buses' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('buses')}>
              <div>
                <div className="text-sm text-muted-foreground">Active Buses</div>
                <div className="text-2xl font-bold">{busesLoading ? '—' : (Array.isArray(availableBuses) ? availableBuses.length : 0)}</div>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </Card>
          </div>

          {/* Detail tables */}
          <div className="space-y-6">
            {selected === null && (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Select a card above to view details and actions.</p>
              </Card>
            )}

            {selected === 'bookings' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Your Bookings</h2>
                  <Button onClick={() => navigate('/routes')} size="sm">
                    Book New Trip
                  </Button>
                </div>

                <div className="overflow-auto">
                  {bookingsLoading ? (
                    <div className="text-sm text-muted-foreground p-4">Loading...</div>
                  ) : !bookings || bookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No bookings yet. Book a trip to get started!</div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-2">Route</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Seats</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking: any) => (
                          <tr key={booking.id} className="border-t">
                            <td className="p-2">{booking.route?.route_name || 'N/A'}</td>
                            <td className="p-2">{new Date(booking.created_at).toLocaleDateString()}</td>
                            <td className="p-2">{booking.seats}</td>
                            <td className="p-2">{booking.status}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/bookings/${booking.id}`)}>
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}

            {selected === 'routes' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Available Routes</h2>
                </div>

                <div className="overflow-auto">
                  {routesLoading ? (
                    <div className="text-sm text-muted-foreground p-4">Loading...</div>
                  ) : !availableRoutes || availableRoutes.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No routes available at the moment.</div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-2">Route Name</th>
                          <th className="p-2">From → To</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Fare</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableRoutes.map((route: any) => (
                          <tr key={route.id} className="border-t">
                            <td className="p-2">{route.route_name}</td>
                            <td className="p-2">{route.start_location} → {route.end_location}</td>
                            <td className="p-2">{route.estimated_duration} mins</td>
                            <td className="p-2">UGX {route.fare.toLocaleString()}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/routes/${route.id}`)}>
                                Book Now
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}

            {selected === 'buses' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Active Buses</h2>
                </div>

                <div className="overflow-auto">
                  {busesLoading ? (
                    <div className="text-sm text-muted-foreground p-4">Loading...</div>
                  ) : !availableBuses || availableBuses.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4">No buses are currently active.</div>
                  ) : (
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="p-2">Bus Number</th>
                          <th className="p-2">Route</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Next Stop</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableBuses.map((bus: any) => (
                          <tr key={bus.id} className="border-t">
                            <td className="p-2">{bus.bus_number}</td>
                            <td className="p-2">{bus.route?.route_name || 'N/A'}</td>
                            <td className="p-2">{bus.current_state}</td>
                            <td className="p-2">{bus.next_stop || 'N/A'}</td>
                            <td className="p-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/tracking/${bus.id}`)}>
                                Track
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
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

export default UserDashboardPage;
