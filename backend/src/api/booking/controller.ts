// src/controllers/bookingController.ts

import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '@/config/prisma.js';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import { AuthRequest } from '@/types/index.js';
import { randomBytes } from 'crypto';

class BookingController {
  /**
   * Create a new booking for the authenticated user.
   * POST /api/bookings
   */
  createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { busId, routeId, fromStopId, toStopId, seatCount = 1, travelDate } = req.body;

    if (!busId || !routeId || !fromStopId || !toStopId || !travelDate) {
      throw new AppError('Bus, route, from/to stops, and travel date are required.', 400);
    }
    
    // --- Validation Phase ---
    const [bus, fromStop, toStop] = await Promise.all([
      prisma.bus.findUnique({ where: { id: busId }, include: { route: true } }),
      prisma.stop.findUnique({ where: { id: fromStopId } }),
      prisma.stop.findUnique({ where: { id: toStopId } }),
    ]);

    if (!bus) throw new AppError('Bus not found.', 404);
    if (!fromStop || !toStop) throw new AppError('One or more stops not found.', 404);
    if (bus.routeId !== routeId || fromStop.routeId !== routeId || toStop.routeId !== routeId) {
      throw new AppError('Bus and stops do not all belong to the specified route.', 400);
    }
    if (fromStop.stopOrder >= toStop.stopOrder) {
      throw new AppError('The "from" stop must be before the "to" stop on the route.', 400);
    }

    // --- Transaction for Capacity Check and Creation ---
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Check available capacity
      const bookingsOnBus = await tx.booking.aggregate({
        where: { busId, travelDate: new Date(travelDate), status: { in: ['confirmed', 'pending'] } },
        _sum: { seatCount: true },
      });
      const bookedSeats = bookingsOnBus._sum.seatCount || 0;
      const availableSeats = bus.capacity - bookedSeats;

      if (availableSeats < seatCount) {
        throw new AppError(`Booking failed: Only ${availableSeats} seats are available.`, 409); // 409 Conflict
      }

      // 2. Calculate fare (simple fare for now)
      const totalFare = (bus.route?.fareAmount?.toNumber() || 500) * seatCount;

      // 3. Generate a unique booking reference
      const bookingReference = `BKL${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`;

      // 4. Create the booking
      return tx.booking.create({
        data: {
          userId, busId, routeId, fromStopId, toStopId,
          seatCount, totalFare, travelDate: new Date(travelDate),
          bookingReference,
        },
        include: {
          bus: { select: { busNumber: true, vehiclePlate: true } },
          route: { select: { name: true } },
          fromStop: { select: { name: true } },
          toStop: { select: { name: true } },
        },
      });
    });

    res.status(201).json({ success: true, message: 'Booking created successfully.', data: booking });
  });

  /**
   * Get bookings for the authenticated user.
   * GET /api/bookings/my
   */
  getMyBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { status } = req.query;
    
    const where: Prisma.BookingWhereInput = { userId };
    if (status && typeof status === 'string') where.status = status as any;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { bookingTime: 'desc' },
      include: {
        route: { select: { name: true, color: true } },
        bus: { select: { busNumber: true } },
        fromStop: { select: { name: true } },
        toStop: { select: { name: true } },
      },
    });

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  });

  /**
   * Get a single booking by its ID.
   * GET /api/bookings/:id
   */
  getBookingById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        bus: { include: { driver: true } },
        route: true, fromStop: true, toStop: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    // Authorization check: User can see own booking, admin/driver can see any.
    if (req.user!.role === 'passenger' && booking.userId !== req.user!.id) {
      throw new AppError('You are not authorized to view this booking.', 403);
    }
    
    res.status(200).json({ success: true, data: booking });
  });

  /**
   * Cancel a booking (by the user who made it).
   * PUT /api/bookings/:id/cancel
   */
  cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }
    if (booking.userId !== userId) {
      throw new AppError('You can only cancel your own bookings.', 403);
    }
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new AppError(`Cannot cancel a booking that is already ${booking.status}.`, 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Cancelled by user',
      },
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.', data: updatedBooking });
  });
}

export const bookingController = new BookingController();