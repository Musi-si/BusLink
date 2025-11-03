// src/services/socketManager.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { calculateRouteETAs, BusLocation } from '../utils/etaCalculator.js';

// --- Type Definitions for Socket Events ---

interface SubscriptionData {
  stopId?: number;
  routeId?: number;
  busId?: number;
}

interface LocationUpdatePayload {
  busId: number;
  routeId: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestamp: string;
}

// --- SocketManager Class ---

/**
 * SocketManager - A singleton service to manage all real-time communication logic
 * for an existing Socket.IO server instance.
 */
class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
    logger.info('SocketManager initialized.');
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Initializes the manager with the main Socket.IO server instance
   * and sets up all event handlers.
   */
  public initialize(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    logger.info('SocketManager has been linked with the Socket.IO server and event handlers are set up.');
  }
  
  /**
   * Main setup for all socket connection and event logic.
   */
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);
      
      socket.on('subscribeToRoute', (routeId: number) => this.handleSubscription(socket, 'route', routeId));
      socket.on('subscribeToBus', (busId: number) => this.handleSubscription(socket, 'bus', busId));
      
      socket.on('unsubscribeFromRoute', (routeId: number) => this.handleUnsubscription(socket, 'route', routeId));
      socket.on('unsubscribeFromBus', (busId: number) => this.handleUnsubscription(socket, 'bus', busId));
      
      socket.on('disconnect', (reason: string) => {
        logger.info(`🔌 Client disconnected: ${socket.id}, Reason: ${reason}`);
      });
      
      socket.emit('connected', { message: 'Successfully connected to BusLink Real-Time Service.' });
    });
  }
  
  /**
   * Generic handler for client subscriptions to rooms.
   */
  private handleSubscription(socket: Socket, type: 'route' | 'bus', id: number) {
    if (!id || typeof id !== 'number') {
      socket.emit('subscriptionError', { message: `Valid numeric ${type} ID is required.` });
      return;
    }
    const roomName = `${type}_${id}`;
    socket.join(roomName);
    logger.info(`Client ${socket.id} subscribed to room: ${roomName}`);
    socket.emit('subscriptionSuccess', { room: roomName });
  }

  /**
   * Generic handler for client unsubscriptions from rooms.
   */
  private handleUnsubscription(socket: Socket, type: 'route' | 'bus', id: number) {
    const roomName = `${type}_${id}`;
    socket.leave(roomName);
    logger.info(`Client ${socket.id} unsubscribed from room: ${roomName}`);
    socket.emit('unsubscriptionSuccess', { room: roomName });
  }

  /**
   * Handles incoming location updates, calculates ETAs, and broadcasts to relevant rooms.
   * This method will be called by other services (like the GPSSimulator or a future controller).
   */
  public async handleLocationUpdate(payload: LocationUpdatePayload) {
    if (!this.io) return;

    const { busId, routeId, latitude, longitude, speedKmh } = payload;
    
    // 1. Broadcast the raw location update to route and bus subscribers
    const locationData = { busId, latitude, longitude, speedKmh, timestamp: new Date().toISOString() };
    this.io.to(`route_${routeId}`).emit('locationUpdate', locationData);
    this.io.to(`bus_${busId}`).emit('locationUpdate', locationData);

    // 2. Calculate ETAs for all upcoming stops on the route
    try {
      const route = await this.prisma.route.findUnique({
        where: { id: routeId },
        include: { stops: { orderBy: { stopOrder: 'asc' } } },
      });

      if (!route || !route.stops.length) return;
      
      const busLocation: BusLocation = { lat: latitude, lng: longitude, speedKmh };
      
      // Find the next stop index
      // (This is a simplified logic; a more advanced version would find the closest stop ahead)
      const upcomingStops = route.stops; // Assuming we calculate ETA for all stops for now
      
      if (upcomingStops.length > 0) {
        const etas = calculateRouteETAs(busLocation, upcomingStops);
        
        // 3. Broadcast the full ETA list to the route room
        this.io.to(`route_${routeId}`).emit('routeEtaUpdate', { busId, etas });
      }
    } catch (error) {
      logger.error('Error calculating or broadcasting ETAs:', error);
    }
  }

  /**
   * Broadcasts a general announcement to all connected clients.
   */
  public broadcastAnnouncement(title: string, message: string, level: 'info' | 'warning' | 'critical' = 'info') {
    if (!this.io) return;
    const payload = { title, message, level, timestamp: new Date().toISOString() };
    this.io.emit('announcement', payload);
    logger.info(`📢 Announcement broadcasted: "${title}"`);
  }
}

// Export a singleton instance
export const socketManager = SocketManager.getInstance();