// src/controllers/driverController.ts

import { Response } from 'express';
// import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma.js';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import { AuthRequest } from '@/types/index.js';

class DriverController {
  /**
   * Get all trips for a specific driver.
   * GET /api/driver/trips
   */
  getDriverTrips = asyncHandler(async (req: AuthRequest, res: Response) => {
    // This logic needs to find the Driver ID from the User ID first.
    const driverProfile = await prisma.driver.findUnique({
        where: { userId: req.user!.id },
    });

    if (!driverProfile) {
        throw new AppError('Driver profile not found for the authenticated user.', 404);
    }
    
    const trips = await prisma.trip.findMany({
      where: { driverId: driverProfile.id }, // Use the correct Driver ID
      orderBy: { startedAt: 'desc' },
      include: {
        route: { select: { name: true } },
      },
    });

    res.status(200).json({ success: true, data: trips });
  });

  /**
   * Get all bookings for the bus currently assigned to the driver.
   * GET /api/driver/my-bus/bookings
   */
  getBusBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    // --- FIX STARTS HERE ---
    // 1. Find the DRIVER profile linked to the authenticated USER
    const driverProfile = await prisma.driver.findUnique({
      where: { userId: req.user!.id },
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found for the authenticated user.', 404);
    }

    // 2. Find the BUS assigned to that DRIVER profile
    const bus = await prisma.bus.findUnique({
      where: { driverId: driverProfile.id },
    });
    // --- FIX ENDS HERE ---

    if (!bus) {
      throw new AppError('No bus is currently assigned to you.', 404);
    }

    const bookings = await prisma.booking.findMany({
      where: { busId: bus.id, status: { in: ['pending', 'confirmed'] } },
      orderBy: { bookingTime: 'asc' },
      include: {
        user: { select: { name: true, phone: true } },
        fromStop: { select: { name: true, stopOrder: true } },
        toStop: { select: { name: true, stopOrder: true } },
      },
    });

    res.status(200).json({ success: true, data: bookings });
  });

  /**
   * Get the active bus assigned to the authenticated driver.
   * GET /api/driver/my-bus
   */
  getActiveBusForDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
    // --- FIX STARTS HERE (Same logic as above) ---
    // 1. Find the DRIVER profile linked to the authenticated USER
    const driverProfile = await prisma.driver.findUnique({
      where: { userId: req.user!.id },
    });

    if (!driverProfile) {
      throw new AppError('Driver profile not found for the authenticated user.', 404);
    }

    // 2. Find the BUS assigned to that DRIVER profile and include relations
    const bus = await prisma.bus.findUnique({
      where: { driverId: driverProfile.id },
      include: {
        route: {
          include: { stops: { orderBy: { stopOrder: 'asc' } } },
        },
        driver: true, // Also include the driver's own details
      },
    });
    // --- FIX ENDS HERE ---

    if (!bus) {
      throw new AppError('No bus is currently assigned to you.', 404);
    }
    
    res.status(200).json({ success: true, data: bus });
  });

  /**
   * Update a bus's current location (from driver mobile/browser GPS).
   * PATCH /api/driver/update-location
   */
  updateLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bus_number, current_lat, current_lng, speed_kmh, source = 'gps' } = req.body as any;

    if (!bus_number || typeof current_lat !== 'number' || typeof current_lng !== 'number') {
      throw new AppError('bus_number, current_lat and current_lng are required and must be numbers', 400);
    }

    // Ensure the authenticated driver actually owns/operates this bus
    const driverProfile = await prisma.driver.findUnique({ where: { userId: req.user!.id } });
    if (!driverProfile) {
      throw new AppError('Driver profile not found for the authenticated user.', 404);
    }

    const bus = await prisma.bus.findUnique({ where: { busNumber: bus_number } });
    if (!bus) {
      throw new AppError('Bus not found', 404);
    }

    if (bus.driverId !== driverProfile.id) {
      throw new AppError('This bus is not assigned to you', 403);
    }

    // Update bus last location and speed
    const updated = await prisma.bus.update({
      where: { id: bus.id },
      data: {
        lastLocationLat: current_lat,
        lastLocationLng: current_lng,
        lastSpeedKmh: speed_kmh ?? undefined,
        lastUpdate: new Date(),
      },
    });

    // Create a location update record for history and analytics
    await prisma.locationUpdate.create({
      data: {
        busId: bus.id,
        latitude: current_lat,
        longitude: current_lng,
        speedKmh: speed_kmh ?? undefined,
        source: source as any,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  });
}

export const driverController = new DriverController();