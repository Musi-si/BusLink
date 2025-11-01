// src/services/gpsSimulator.ts

import { PrismaClient, Bus, Route, Stop, BusStatus, BusDirection } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger.js';
import { busStateManager } from './busStateManager.js';
import { calculateDistance } from '../utils/etaCalculator.js';

// --- Type Definitions ---
type PrismaBusWithRelations = Bus & {
  route: (Route & { stops: Stop[] }) | null;
};

interface SimulatedBusData {
  id: number;
  busNumber: string;
  routeId: number;
  stops: Stop[];
  currentStopIndex: number;
  nextStopIndex: number;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  status: BusStatus;
  direction: BusDirection;
  lastUpdate: Date;
}

/**
 * GPSSimulator - A singleton service to simulate the real-time movement of buses.
 */
class GpsSimulator {
  private static instance: GpsSimulator;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private updateInterval = 5000;
  private simulatedBuses = new Map<number, SimulatedBusData>();
  private prisma: PrismaClient;
  private io: SocketIOServer | null = null;

  private constructor() {
    this.prisma = new PrismaClient();
    logger.info('GPSSimulator initialized.');
  }

  public static getInstance(): GpsSimulator {
    if (!GpsSimulator.instance) {
      GpsSimulator.instance = new GpsSimulator();
    }
    return GpsSimulator.instance;
  }

  public initialize(io: SocketIOServer) {
    this.io = io;
    logger.info('GPSSimulator has been linked with the Socket.IO server.');
  }

  public async startSimulation() {
    if (this.isRunning) {
      logger.warn('GPS Simulation is already running.');
      return;
    }
    if (!this.io) {
      logger.error('GPSSimulator not initialized with Socket.IO server. Cannot start.');
      return;
    }

    try {
      logger.info('Starting GPS simulation...');
      await this.loadBusesForSimulation();
      this.intervalId = setInterval(() => this.updateAllBusPositions(), this.updateInterval);
      this.isRunning = true;
      logger.info(`✅ GPS simulation started. Update interval: ${this.updateInterval / 1000}s`);
    } catch (error) {
      logger.error('Failed to start GPS simulation:', error);
    }
  }

  public stopSimulation() {
    if (!this.isRunning) return;
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.simulatedBuses.clear();
    logger.info('🛑 GPS simulation stopped.');
  }

  // --- FIX: ADD THE MISSING PUBLIC METHODS ---

  /**
   * Gets the current status and statistics of the simulator.
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      updateInterval: this.updateInterval,
      simulatedBusesCount: this.simulatedBuses.size,
      simulatedBusIds: Array.from(this.simulatedBuses.keys()),
    };
  }

  /**
   * Fetches a bus by its ID and adds it to the live simulation.
   */
  public async addBusToSimulation(busId: number): Promise<void> {
    if (this.simulatedBuses.has(busId)) {
      logger.warn(`Bus ${busId} is already being simulated.`);
      return;
    }

    const bus = await this.prisma.bus.findUnique({
      where: { id: busId },
      include: {
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
      },
    });

    if (bus) {
      this.addBusToSimulationMap(bus);
      logger.info(`Bus ${bus.busNumber} (ID: ${busId}) has been dynamically added to the simulation.`);
    } else {
      logger.error(`Failed to add bus ${busId} to simulation: Bus not found.`);
    }
  }

  /**
   * Removes a bus from the live simulation by its ID.
   */
  public removeBusFromSimulation(busId: number): void {
    if (this.simulatedBuses.has(busId)) {
      this.simulatedBuses.delete(busId);
      logger.info(`Bus ${busId} has been removed from the simulation.`);
    } else {
      logger.warn(`Cannot remove bus ${busId}: It was not being simulated.`);
    }
  }
  
  // --- PRIVATE METHODS (no changes below this line) ---

  private async loadBusesForSimulation() {
    const activeBuses = await this.prisma.bus.findMany({
      where: {
        status: { in: ['moving', 'idle', 'arrived'] },
        isTracked: true,
      },
      include: {
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
      },
    });

    logger.info(`Found ${activeBuses.length} buses to simulate.`);
    this.simulatedBuses.clear();
    activeBuses.forEach(bus => this.addBusToSimulationMap(bus));
  }
  
  private addBusToSimulationMap(bus: PrismaBusWithRelations) {
    if (!bus.route || !bus.route.stops || bus.route.stops.length < 2) {
      logger.warn(`Bus ${bus.busNumber} cannot be simulated: missing route or sufficient stops.`);
      return;
    }
    
    const stops = bus.route.stops;
    const currentStopIndex = bus.currentStopId ? Math.max(0, stops.findIndex(s => s.id === bus.currentStopId)) : 0;
    const nextStopIndex = (currentStopIndex + 1) % stops.length;
    
    const simData: SimulatedBusData = {
      id: bus.id,
      busNumber: bus.busNumber,
      routeId: bus.routeId,
      stops: bus.route.stops,
      currentStopIndex,
      nextStopIndex,
      currentLat: bus.lastLocationLat ?? stops[currentStopIndex].latitude,
      currentLng: bus.lastLocationLng ?? stops[currentStopIndex].longitude,
      speedKmh: 25 + Math.random() * 15,
      status: bus.status,
      direction: bus.direction,
      lastUpdate: new Date(),
    };
    this.simulatedBuses.set(bus.id, simData);
  }

  private async updateAllBusPositions() {
    if (this.simulatedBuses.size === 0) return;
    
    const updatePromises = Array.from(this.simulatedBuses.values()).map(busData =>
      this.updateSingleBusPosition(busData)
    );
    await Promise.all(updatePromises);
  }

  private async updateSingleBusPosition(busData: SimulatedBusData) {
    const { stops, currentStopIndex, speedKmh } = busData;
    const nextStop = stops[busData.nextStopIndex];
    if (!nextStop) return;

    const distanceToNextStop = calculateDistance(busData.currentLat, busData.currentLng, nextStop.latitude, nextStop.longitude);
    const travelDistancePerTick = (speedKmh * 1000 / 3600) * (this.updateInterval / 1000);

    if (distanceToNextStop <= travelDistancePerTick) {
      busData.currentLat = nextStop.latitude;
      busData.currentLng = nextStop.longitude;
      busData.currentStopIndex = busData.nextStopIndex;
      busData.nextStopIndex = (busData.nextStopIndex + 1) % stops.length;
      busData.speedKmh = 0;
    } else {
      const ratio = travelDistancePerTick / distanceToNextStop;
      busData.currentLat += (nextStop.latitude - busData.currentLat) * ratio;
      busData.currentLng += (nextStop.longitude - busData.currentLng) * ratio;
      busData.speedKmh = Math.max(10, speedKmh + (Math.random() - 0.5) * 5);
    }
    busData.lastUpdate = new Date();

    try {
      await this.prisma.bus.update({
        where: { id: busData.id },
        data: {
          lastLocationLat: busData.currentLat,
          lastLocationLng: busData.currentLng,
          lastSpeedKmh: busData.speedKmh,
          lastUpdate: busData.lastUpdate,
          currentStopId: stops[busData.currentStopIndex].id,
          nextStopId: stops[busData.nextStopIndex].id,
        },
      });
      
      await busStateManager.autoUpdateState(busData.id, { speedKmh: busData.speedKmh });
      
      const payload = {
        busId: busData.id,
        routeId: busData.routeId,
        latitude: busData.currentLat,
        longitude: busData.currentLng,
        speedKmh: Math.round(busData.speedKmh),
        timestamp: busData.lastUpdate.toISOString(),
      };
      
      this.io?.to(`route_${busData.routeId}`).emit('driverLocationUpdated', payload);
      logger.debug(`Updated bus ${busData.busNumber} position: ${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`);

    } catch (error) {
      logger.error(`Error updating bus ${busData.busNumber} in DB:`, error);
    }
  }
}

export const gpsSimulator = GpsSimulator.getInstance();