// src/services/socketManager.ts

import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import { calculateRouteETAs, BusLocation } from '../utils/etaCalculator.js';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types/index.js';

// Extend the Socket type to include our custom user property
interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;
  private prisma: PrismaClient;
  private userSocketMap = new Map<number, string>(); // Map<userId, socketId>

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
  
  public initialize(io: SocketIOServer) {
    this.io = io;
    
    // Middleware to authenticate socket connections via JWT
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
          socket.user = decoded; // Attach user data to the socket
        } catch (err) {
          logger.warn(`Socket connection rejected: Invalid token.`);
          return next(new Error('Authentication error'));
        }
      }
      next();
    });
    
    this.setupEventHandlers();
    logger.info('SocketManager linked with Socket.IO server and handlers are set up.');
  }
  
  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);
      
      // If the user is authenticated, map their ID to their socket ID
      if (socket.user) {
        this.userSocketMap.set(socket.user.id, socket.id);
        logger.info(`Authenticated user ${socket.user.email} (ID: ${socket.user.id}) mapped to socket ${socket.id}`);
      }

      socket.on('subscribeToRoute', (routeId: number) => this.handleSubscription(socket, 'route', routeId));
      socket.on('subscribeToBus', (busId: number) => this.handleSubscription(socket, 'bus', busId));
      
      socket.on('unsubscribeFromRoute', (routeId: number) => this.handleUnsubscription(socket, 'route', routeId));
      socket.on('unsubscribeFromBus', (busId: number) => this.handleUnsubscription(socket, 'bus', busId));
      
      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
        // If the disconnected user was authenticated, remove them from the map
        if (socket.user) {
          // Only remove if the socket ID matches, to prevent issues on quick reconnects
          if (this.userSocketMap.get(socket.user.id) === socket.id) {
            this.userSocketMap.delete(socket.user.id);
            logger.info(`Unmapped user ${socket.user.email} (ID: ${socket.user.id})`);
          }
        }
      });
      
      socket.emit('connected', { message: 'Successfully connected to BusLink Real-Time Service.' });
    });
  }
  
  // --- NEW METHOD ---
  /**
   * Sends a real-time event to a specific user if they are currently connected.
   * @param userId The ID of the user to notify.
   * @param eventName The name of the socket event (e.g., 'new_notification').
   * @param payload The data to send with the event.
   */
  public notifyUser(userId: number, eventName: string, payload: any) {
    if (!this.io) return;

    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(eventName, payload);
      logger.info(`Sent event '${eventName}' to user ${userId} on socket ${socketId}`);
    } else {
      logger.info(`User ${userId} is not currently connected. Notification not sent in real-time.`);
    }
  }

  // --- No changes to the methods below ---

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

  private handleUnsubscription(socket: Socket, type: 'route' | 'bus', id: number) {
    const roomName = `${type}_${id}`;
    socket.leave(roomName);
    logger.info(`Client ${socket.id} unsubscribed from room: ${roomName}`);
    socket.emit('unsubscriptionSuccess', { room: roomName });
  }

  public async handleLocationUpdate(payload: any) { // Keep `any` for simplicity from simulator
    if (!this.io) return;
    const { busId, routeId, latitude, longitude, speedKmh } = payload;
    const locationData = { busId, latitude, longitude, speedKmh, timestamp: new Date().toISOString() };
    this.io.to(`route_${routeId}`).emit('locationUpdate', locationData);
    this.io.to(`bus_${busId}`).emit('locationUpdate', locationData);
  }

  public broadcastAnnouncement(title: string, message: string, level: 'info' | 'warning' | 'critical' = 'info') {
    if (!this.io) return;
    const payload = { title, message, level, timestamp: new Date().toISOString() };
    this.io.emit('announcement', payload);
    logger.info(`📢 Announcement broadcasted: "${title}"`);
  }
}

export const socketManager = SocketManager.getInstance();