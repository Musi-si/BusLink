export interface Bus {
  id: string;
  bus_number: string;
  capacity: number;
  current_lat: number;
  current_lng: number;
  current_state: 'idle' | 'moving' | 'maintenance' | 'offline';
  speed_kmh: number;
  route?: Route;
  routeId?: string;
}

export interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  total_distance_km: number;
  estimated_duration_min: number;
  active: boolean;
  stops?: Stop[];
  buses?: Bus[];
}

export interface Stop {
  id: string;
  stop_name: string;
  latitude: number;
  longitude: number;
  stop_order: number;
  routeId: string;
}

export interface Booking {
  id: string;
  userId: string;
  busId: string;
  routeId: string;
  fromStopId: string;
  toStopId: string;
  travelDate: string;
  seatCount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  createdAt: string;
  bus?: Bus;
  route?: Route;
  fromStop?: Stop;
  toStop?: Stop;
}

export interface BusProgress {
  busId: string;
  routeId: string;
  completionPercentage: number;
  nextStopId: string;
  etas: Array<{
    stopId: string;
    stopName: string;
    estimatedArrival: string;
    distanceMeters: number;
  }>;
}

export type BusWithRelations = Bus & {
  bus_number: string;
  capacity: number;
  current_lat: number;
  current_lng: number;
  speed_kmh: number;
};

export type TripWithRelations = {
  id: string;
  created_at: string;
  startedAt?: string;
  route?: { route_name?: string };
  distance_km?: number;
  duration_mins?: number;
  status?: string;
};

export type BookingWithRelations = {
  id: string;
  user?: { name?: string; email?: string };
  seats?: number;
  created_at?: string;
  status?: string;
};