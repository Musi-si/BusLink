import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

export interface LocationUpdate {
  busId: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestamp: string;
}

export interface RouteEtaUpdate {
  busId: string;
  etas: Array<{
    stopId: string;
    estimatedArrival: string;
    distanceMeters: number;
  }>;
}

export interface BusStateChange {
  busId: string;
  currentState: string;
  previousState: string;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const subscribeToRoute = (routeId: string) => {
    socketRef.current?.emit('subscribeToRoute', routeId);
  };

  const unsubscribeFromRoute = (routeId: string) => {
    socketRef.current?.emit('unsubscribeFromRoute', routeId);
  };

  const onLocationUpdate = (callback: (data: LocationUpdate) => void) => {
    socketRef.current?.on('locationUpdate', callback);
    return () => {
      socketRef.current?.off('locationUpdate', callback);
    };
  };

  const onRouteEtaUpdate = (callback: (data: RouteEtaUpdate) => void) => {
    socketRef.current?.on('routeEtaUpdate', callback);
    return () => {
      socketRef.current?.off('routeEtaUpdate', callback);
    };
  };

  const onBusStateChange = (callback: (data: BusStateChange) => void) => {
    socketRef.current?.on('busStateChange', callback);
    return () => {
      socketRef.current?.off('busStateChange', callback);
    };
  };

  return {
    socket: socketRef.current,
    isConnected,
    subscribeToRoute,
    unsubscribeFromRoute,
    onLocationUpdate,
    onRouteEtaUpdate,
    onBusStateChange,
  };
};
