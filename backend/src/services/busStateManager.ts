// src/services/busStateManager.ts

import { PrismaClient, BusStatus } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger.js';

// Define a type for the context passed during state transitions
interface TransitionContext {
  autoUpdate?: boolean;
  locationData?: { speedKmh?: number };
  reason?: string;
}

/**
 * BusStateManager - A singleton class to manage the state machine for buses.
 * Handles state transitions: Idle, Moving, Arrived, Offline, Maintenance.
 */
class BusStateManager {
  private static instance: BusStateManager;
  private prisma: PrismaClient;
  private io: SocketIOServer | null = null;
  
  // A map defining the valid transitions from one state to another.
  private validTransitions: Record<BusStatus, BusStatus[]> = {
    idle: ['moving', 'offline', 'maintenance'],
    moving: ['arrived', 'idle', 'offline'],
    arrived: ['moving', 'idle', 'offline'],
    offline: ['idle', 'maintenance'],
    maintenance: ['idle', 'offline'],
  };

  private constructor() {
    this.prisma = new PrismaClient();
    logger.info('BusStateManager initialized.');
  }

  /**
   * Initializes the singleton with the Socket.IO server instance.
   * This should be called once in your main index.ts file.
   */
  public initialize(io: SocketIOServer) {
    this.io = io;
    logger.info('BusStateManager has been linked with the Socket.IO server.');
  }

  /**
   * Gets the singleton instance of the BusStateManager.
   */
  public static getInstance(): BusStateManager {
    if (!BusStateManager.instance) {
      BusStateManager.instance = new BusStateManager();
    }
    return BusStateManager.instance;
  }

  /**
   * Checks if a state transition is valid based on the defined rules.
   */
  private isValidTransition(currentState: BusStatus, newState: BusStatus): boolean {
    if (currentState === newState) return true; // No change is always valid
    return this.validTransitions[currentState]?.includes(newState) ?? false;
  }

  /**
   * Transitions a bus to a new state if the transition is valid.
   * @returns An object indicating the result of the transition attempt.
   */
  public async transitionState(busId: number, newState: BusStatus, context: TransitionContext = {}) {
    try {
      const bus = await this.prisma.bus.findUnique({ where: { id: busId } });
      if (!bus) {
        throw new Error(`Bus with ID ${busId} not found.`);
      }

      const currentState = bus.status;
      if (!this.isValidTransition(currentState, newState)) {
        const message = `Invalid state transition for bus ${bus.busNumber}: from '${currentState}' to '${newState}'.`;
        logger.warn(message);
        return { success: false, message, currentState, requestedState: newState };
      }
      
      // Update the bus's state and last update time in the database
      const updatedBus = await this.prisma.bus.update({
        where: { id: busId },
        data: { status: newState, lastUpdate: new Date() },
      });
      
      logger.info(`Bus ${updatedBus.busNumber} state changed: ${currentState} → ${newState}`);
      
      // Broadcast the state change to connected clients
      this.broadcastStateChange(updatedBus.id, currentState, newState, updatedBus.routeId, context);
      
      return {
        success: true,
        message: 'State transitioned successfully.',
        previousState: currentState,
        currentState: newState,
      };
    } catch (error) {
      logger.error(`Error transitioning bus ${busId} state:`, error);
      return { success: false, message: (error as Error).message };
    }
  }

  /**
   * Automatically updates a bus's state based on its speed.
   */
  public async autoUpdateState(busId: number, locationData: { speedKmh?: number }) {
    try {
      const bus = await this.prisma.bus.findUnique({ where: { id: busId } });
      if (!bus) {
        return { success: false, message: 'Bus not found.' };
      }

      const { speedKmh = 0 } = locationData;
      let newPotentialState: BusStatus | null = null;
      
      // Logic to determine new state based on speed
      if (speedKmh > 5 && (bus.status === 'idle' || bus.status === 'arrived')) {
        newPotentialState = 'moving';
      } else if (speedKmh <= 5 && bus.status === 'moving') {
        newPotentialState = 'idle'; // Could also be 'arrived', needs geofence logic
      }

      if (newPotentialState && bus.status !== newPotentialState) {
        return this.transitionState(busId, newPotentialState, {
          autoUpdate: true,
          locationData,
        });
      }

      return { success: true, message: 'No state change required.', currentState: bus.status };
    } catch (error) {
      logger.error(`Error auto-updating state for bus ${busId}:`, error);
      return { success: false, message: (error as Error).message };
    }
  }
  
  /**
   * Broadcasts a state change event via Socket.IO to relevant rooms.
   */
  private broadcastStateChange(
    busId: number, 
    previousState: BusStatus, 
    currentState: BusStatus,
    routeId: number,
    context: TransitionContext
  ) {
    if (!this.io) {
      logger.warn('Socket.IO server not initialized in BusStateManager. Cannot broadcast state change.');
      return;
    }

    const payload = {
      busId,
      previousState,
      currentState,
      timestamp: new Date().toISOString(),
      context: context.autoUpdate ? { autoUpdate: true } : {},
    };
    
    // Broadcast to clients subscribed to this specific bus
    this.io.to(`bus_${busId}`).emit('stateChange', payload);
    // Broadcast to clients subscribed to the bus's route
    this.io.to(`route_${routeId}`).emit('busStateChange', payload);
  }
}

// Export a singleton instance of the class
export const busStateManager = BusStateManager.getInstance();