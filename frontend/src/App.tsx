import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EmailVerification from "./pages/EmailVerification";
import RouteDetailPage from "./pages/RouteDetailPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import DriverDashboardPage from "./pages/DriverDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import NotFound from "./pages/NotFound";
import "leaflet/dist/leaflet.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page without MainLayout */}
          <Route path="/" element={<LandingPage />} />
          
          {/* App routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/tracking" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/routes/:id" element={<RouteDetailPage />} />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute requiredRole="passenger">
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/driver/dashboard"
              element={
                <ProtectedRoute requiredRole="driver">
                  <DriverDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard/passenger"
              element={
                <ProtectedRoute requiredRole="passenger">
                  <UserDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
