import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'passenger' | 'driver' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log('ProtectedRoute check:', { isAuthenticated, userRole: user?.role, requiredRole });

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    console.log(`Role mismatch - required: ${requiredRole}, user has: ${user?.role}`);
    return <Navigate to="/" replace />;
  }

  console.log('Auth check passed, rendering protected content');
  return <>{children}</>;
};
