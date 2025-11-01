import { Link, useNavigate, Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/stores/authStore';
import { axiosInstance } from '@/lib/axios';
import { Bus, LogOut, MapPin, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MainLayout = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
      clearAuth();
      toast({
        title: 'Logged out successfully',
        description: 'See you next time!',
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuth();
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/tracking" className="flex items-center gap-2 font-bold text-xl">
            <Bus className="h-6 w-6 text-primary" />
            <span className="text-primary">Bus</span>Link
          </Link>

          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                {/* Notification and profile icons */}
                <Button variant="ghost" size="sm" className="mr-2" aria-label="notifications">
                  <Bell className="h-4 w-4" />
                </Button>
                {user?.role === 'driver' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/driver/dashboard">Dashboard</Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t bg-card py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 BusLink. Real-time bus tracking made simple.</p>
        </div>
      </footer>
    </div>
  );
};
