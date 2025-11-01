import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Truck, MapPin, Bell, Plus, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/auth/ChangePasswordDialog';
import { UpdatePhoneDialog } from '@/components/auth/UpdatePhoneDialog';
import { AddUserDialog } from '@/components/admin/AddUserDialog';
import { AddBusDialog } from '@/components/admin/AddBusDialog';
import { AddRouteDialog } from '@/components/admin/AddRouteDialog';

type SelectedView = 'users' | 'buses' | 'routes' | null;

const AdminDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SelectedView>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddBusDialogOpen, setIsAddBusDialogOpen] = useState(false);
  const [isAddRouteDialogOpen, setIsAddRouteDialogOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, busesRes, routesRes] = await Promise.all([
        axiosInstance.get('/api/admin/users/count'),
        axiosInstance.get('/api/admin/buses/count'),
        axiosInstance.get('/api/admin/routes/count'),
      ]);
      return {
        users: usersRes.data.count ?? 0,
        buses: busesRes.data.count ?? 0,
        routes: routesRes.data.count ?? 0,
      };
    },
    retry: 0,
  });

  const { data: usersList } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await axiosInstance.get('/api/admin/users')).data,
    enabled: selected === 'users',
  });

  const { data: busesList } = useQuery({
    queryKey: ['admin-buses'],
    queryFn: async () => (await axiosInstance.get('/api/admin/buses')).data,
    enabled: selected === 'buses',
  });

  const { data: routesList, refetch } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await axiosInstance.get('/api/admin/routes')).data,
    enabled: selected === 'routes',
  });

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
        
        <ChangePasswordDialog 
          open={isPasswordDialogOpen} 
          onOpenChange={setIsPasswordDialogOpen} 
        />

        {/* Main content */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'users' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('users')}>
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">{statsLoading ? '—' : stats?.users ?? 0}</div>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'buses' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('buses')}>
              <div>
                <div className="text-sm text-muted-foreground">Total Buses</div>
                <div className="text-2xl font-bold">{statsLoading ? '—' : stats?.buses ?? 0}</div>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </Card>

            <Card className={`p-4 flex items-center justify-between cursor-pointer ${selected === 'routes' ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelected('routes')}>
              <div>
                <div className="text-sm text-muted-foreground">Total Routes</div>
                <div className="text-2xl font-bold">{statsLoading ? '—' : stats?.routes ?? 0}</div>
              </div>
              <MapPin className="h-8 w-8 text-primary" />
            </Card>
          </div>

          {/* Detail tables */}
          <div className="space-y-6">
            {selected === null && (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">Select a card above to view details and actions.</p>
              </Card>
            )}

            {selected === 'users' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Users</h2>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/admin/users/new')} size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add User
                    </Button>
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(usersList) && usersList.map((u: any) => (
                        <tr key={u.id} className="border-t">
                          <td className="p-2">{u.name}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2">{u.role}</td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${u.id}`)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {selected === 'buses' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Buses</h2>
                  <Button onClick={() => setIsAddBusDialogOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Bus
                  </Button>
                </div>

                <div className="overflow-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-2">Bus Number</th>
                        <th className="p-2">Capacity</th>
                        <th className="p-2">State</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(busesList) && busesList.map((b: any) => (
                        <tr key={b.id} className="border-t">
                          <td className="p-2">{b.bus_number}</td>
                          <td className="p-2">{b.capacity}</td>
                          <td className="p-2">{b.current_state}</td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/buses/${b.id}`)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {selected === 'routes' && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Routes</h2>
                  <Button onClick={() => setIsAddRouteDialogOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Route
                  </Button>
                </div>

                <div className="overflow-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="p-2">Route Number</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">From → To</th>
                        <th className="p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(routesList) && routesList.map((r: any) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2">{r.route_number}</td>
                          <td className="p-2">{r.route_name}</td>
                          <td className="p-2">{r.start_location} → {r.end_location}</td>
                          <td className="p-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/routes/${r.id}`)}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      <AddUserDialog 
        open={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen} 
        onSuccess={() => {
          // Refetch users list
          if (selected === 'users') {
            void refetch();
          }
        }} 
      />

      <AddBusDialog 
        open={isAddBusDialogOpen} 
        onOpenChange={setIsAddBusDialogOpen} 
        onSuccess={() => {
          // Refetch buses list
          if (selected === 'buses') {
            void refetch();
          }
        }} 
      />

      <AddRouteDialog 
        open={isAddRouteDialogOpen} 
        onOpenChange={setIsAddRouteDialogOpen} 
        onSuccess={() => {
          // Refetch routes list
          if (selected === 'routes') {
            void refetch();
          }
        }} 
      />
    </div>
  );
};

export default AdminDashboardPage;
