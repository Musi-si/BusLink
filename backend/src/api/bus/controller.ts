// src/controllers/busController.ts

import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '@/config/prisma.js';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
// FIX: Add calculateRouteETAs and BusLocation to the import
import { calculateRealTimeETA, calculateRouteETAs, Location } from '@/utils/etaCalculator.js';import { busStateManager } from '@/services/busStateManager.js';
import { socketManager } from '@/services/socket.js';
import { AuthRequest } from '@/types/index.js';

class BusController {
  /**
   * Get a list of all buses with optional filtering.
   * GET /api/buses
   */
  getAllBuses = asyncHandler(async (req: Request, res: Response) => {
    const { status, routeId, limit = 50 } = req.query;

    const where: Prisma.BusWhereInput = {};
    if (status && typeof status === 'string') where.status = status as any;
    if (routeId) where.routeId = parseInt(routeId as string);

    const buses = await prisma.bus.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { lastUpdate: 'desc' },
      include: {
        route: { select: { id: true, name: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    });

    res.status(200).json({ success: true, count: buses.length, data: buses });
  });

  /**
   * Get detailed information for a single bus by its ID.
   * GET /api/buses/:id
   */
  getBusById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const bus = await prisma.bus.findUnique({
      where: { id: parseInt(id) },
      include: {
        driver: true,
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
        currentStop: true,
        nextStop: true,
      },
    });

    if (!bus) {
      throw new AppError('Bus not found', 404);
    }
    
    // Calculate ETA to the next stop
    let etaToNextStop = null;
    if (bus.nextStop && bus.lastLocationLat && bus.lastLocationLng) {
      const busLocation: Location = { lat: bus.lastLocationLat, lng: bus.lastLocationLng };
      etaToNextStop = calculateRealTimeETA(busLocation, bus.nextStop);
    }

    res.status(200).json({ success: true, data: { ...bus, etaToNextStop } });
  });
  
  /**
   * Get a list of all ACTIVE buses (moving, idle, arrived).
   * GET /api/buses/active
   */
  getActiveBuses = asyncHandler(async (req: Request, res: Response) => {
    const { routeId, limit = 100 } = req.query;

    const where: Prisma.BusWhereInput = {
      status: { in: ['moving', 'idle', 'arrived'] },
    };
    if (routeId) where.routeId = parseInt(routeId as string);

    const buses = await prisma.bus.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { lastUpdate: 'desc' },
      include: {
        route: { select: { id: true, name: true, color: true } },
        driver: { select: { id: true, name: true } },
        currentStop: { select: { id: true, name: true } },
        nextStop: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({ success: true, count: buses.length, data: buses });
  });

  /**
   * Get the real-time progress of a bus along its route.
   * GET /api/buses/:id/progress
   */
  getBusProgress = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const bus = await prisma.bus.findUnique({
      where: { id: parseInt(id) },
      include: {
        route: { include: { stops: { orderBy: { stopOrder: 'asc' } } } },
        currentStop: true,
        nextStop: true,
      },
    });

    if (!bus || !bus.route) {
      throw new AppError('Bus or its associated route not found', 404);
    }
    
    const { stops } = bus.route;
    const currentStopIndex = bus.currentStopId ? stops.findIndex(stop => stop.id === bus.currentStopId) : -1;
    
    const remainingStops = currentStopIndex !== -1 ? stops.slice(currentStopIndex + 1) : stops;

    let etasToStops: any[] = [];
    if (bus.lastLocationLat && bus.lastLocationLng && remainingStops.length > 0) {
      const busLocation: Location & { speedKmh?: number } = {
        lat: bus.lastLocationLat,
        lng: bus.lastLocationLng,
        speedKmh: bus.lastSpeedKmh?.toNumber() ?? 25,
      };
      etasToStops = calculateRouteETAs(busLocation, remainingStops);
    }
    
    const progress = {
      totalStops: stops.length,
      currentStopIndex: currentStopIndex,
      progressPercentage: currentStopIndex >= 0 ? Math.round(((currentStopIndex + 1) / stops.length) * 100) : 0,
      currentStop: bus.currentStop,
      nextStop: bus.nextStop,
      remainingStopsCount: remainingStops.length,
      etasToRemainingStops: etasToStops,
    };
    
    res.status(200).json({ success: true, data: progress });
  });

  /**
   * Get recent location history for a single bus.
   * GET /api/buses/:id/history
   */
  getBusLocationHistory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { hours = 24, limit = 100 } = req.query;

    const timeLimit = new Date();
    timeLimit.setHours(timeLimit.getHours() - parseInt(hours as string));

    const history = await prisma.locationUpdate.findMany({
      where: {
        busId: parseInt(id),
        timestamp: { gte: timeLimit },
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
    });

    res.status(200).json({ success: true, count: history.length, data: history });
  });

  /**
   * Find buses near a given geographic coordinate.
   * GET /api/buses/nearby?lat=...&lng=...
   */
  getNearbyBuses = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 2000 } = req.query; // Default 2km radius

    if (!lat || !lng) {
      throw new AppError('Latitude (lat) and longitude (lng) are required query parameters.', 400);
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = parseInt(radius as string);
    
    // PostGIS is required for efficient geo-queries. This raw query uses the earthdistance extension.
    // Ensure you have run: CREATE EXTENSION IF NOT EXISTS cube; CREATE EXTENSION IF NOT EXISTS earthdistance;
    const nearbyBuses = await prisma.$queryRaw`
      SELECT
        b.id, b.bus_number, b.status, b.last_location_lat as "latitude", b.last_location_lng as "longitude",
        r.name as "routeName",
        (point(b.last_location_lng, b.last_location_lat) <@> point(${longitude}, ${latitude})) * 1609.34 as "distanceMeters"
      FROM "buses" b
      LEFT JOIN "routes" r ON b.route_id = r.id
      WHERE (point(b.last_location_lng, b.last_location_lat) <@> point(${longitude}, ${latitude})) * 1609.34 < ${searchRadius}
      ORDER BY "distanceMeters" ASC;
    `;

    res.status(200).json({ success: true, data: nearbyBuses });
  });

  /**
   * Endpoint for an authenticated driver to update their bus's location.
   * POST /api/buses/location
   */
  updateBusLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
    // This is an authenticated route, so req.user is available
    if (!req.user || req.user.role !== 'driver') {
      throw new AppError('Forbidden: Only authenticated drivers can update locations.', 403);
    }

    const { latitude, longitude, speedKmh } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new AppError('Valid latitude and longitude are required.', 400);
    }

    // 2. Find the DRIVER profile linked to the authenticated USER
    const driverProfile = await prisma.driver.findUnique({
      where: { userId: req.user.id },
    });

    if (!driverProfile) {
      throw new AppError('No driver profile found for the authenticated user.', 404);
    }
    
    // Find the bus assigned to this driver
    const bus = await prisma.bus.findUnique({
      where: { driverId: driverProfile.id },
    });
    
    if (!bus) {
      throw new AppError('No bus assigned to the authenticated driver.', 404);
    }

    // --- Update Database ---
    const updatedBus = await prisma.bus.update({
      where: { id: bus.id },
      data: {
        lastLocationLat: latitude,
        lastLocationLng: longitude,
        lastSpeedKmh: speedKmh,
        lastUpdate: new Date(),
      },
    });
    
    await prisma.locationUpdate.create({
      data: { busId: bus.id, latitude, longitude, speedKmh, source: 'gps' },
    });

    // --- Handle Real-time Logic ---
    const payload = {
      busId: updatedBus.id,
      routeId: updatedBus.routeId,
      latitude,
      longitude,
      speedKmh: speedKmh || 0,
      timestamp: new Date().toISOString()
    };
    
    // Use services to handle complex logic
    socketManager.handleLocationUpdate(payload);
    busStateManager.autoUpdateState(bus.id, { speedKmh });

    res.status(200).json({ success: true, message: 'Location updated successfully.' });
  });
}

export const busController = new BusController();