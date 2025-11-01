import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'passenger' | 'driver' | 'admin';
  phone: string;
  license?: string;
  plate?: string;
  model?: string;
  capacity?: number;
  bus_number?: string; // This should be set by the backend when assigning a bus to a driver
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('buslink_token', token);
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        localStorage.removeItem('buslink_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'buslink-auth',
    }
  )
);
