// src/controllers/reportController.ts

import { Response } from 'express';
import prisma from '@/config/prisma.js';
import { asyncHandler, AppError } from '@/middleware/errorHandler.js';
import { AuthRequest } from '@/types/index.js';

class ReportController {
  /**
   * Generates a system-wide summary report. (Admin only)
   * GET /api/reports/system
   */
  getSystemReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Perform all aggregations in parallel for efficiency
    const [
      totalUsers, totalDrivers, totalBuses, totalRoutes,
      totalBookings, completedBookings, cancelledBookings,
      totalRevenue,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.driver.count(),
      prisma.bus.count(),
      prisma.route.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'completed' } }),
      prisma.booking.count({ where: { status: 'cancelled' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid' },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers, totalDrivers, totalBuses, totalRoutes, totalBookings,
        completedBookings, cancelledBookings,
        totalRevenue: totalRevenue._sum.amount?.toNumber() ?? 0,
      },
    });
  });

  /**
   * Generates a detailed report for a specific route. (Admin only)
   * GET /api/reports/route/:id
   */
  getRouteReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const routeId = parseInt(id);

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        _count: {
          select: {
            stops: { where: { isActive: true } },
            buses: true,
          },
        },
      },
    });

    if (!route) {
      throw new AppError('Route not found', 404);
    }

    const [bookingsOnRoute, revenueFromRoute] = await prisma.$transaction([
      prisma.booking.count({ where: { routeId } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'paid', booking: { routeId } },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        routeId: route.id,
        routeName: route.name,
        totalStops: route._count.stops,
        totalBusesAssigned: route._count.buses,
        totalBookings: bookingsOnRoute,
        totalRevenue: revenueFromRoute._sum.amount?.toNumber() ?? 0,
      },
    });
  });

  /**
   * Generates a personalized report for the authenticated passenger.
   * GET /api/reports/passenger/me
   */
  getPassengerReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const [totalBookings, completedBookings, totalSpent] = await prisma.$transaction([
      prisma.booking.count({ where: { userId } }),
      prisma.booking.count({ where: { userId, status: 'completed' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { booking: { userId }, status: 'paid' },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        userId,
        totalBookings,
        completedBookings,
        totalSpent: totalSpent._sum.amount?.toNumber() ?? 0,
      },
    });
  });

  /**
   * Generates a personalized report for the authenticated driver.
   * GET /api/reports/driver/me
   */
  getDriverReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const driverProfile = await prisma.driver.findUnique({ where: { userId } });

    if (!driverProfile) {
      throw new AppError('Driver profile not found.', 404);
    }

    const [totalTrips, totalBookingsOnBus] = await prisma.$transaction([
      prisma.trip.count({ where: { driverId: driverProfile.id } }),
      prisma.booking.count({
        where: { bus: { driverId: driverProfile.id } },
      }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        driverId: driverProfile.id,
        totalTrips,
        totalBookingsServed: totalBookingsOnBus,
        currentRating: driverProfile.rating,
      },
    });
  });
}

export const reportController = new ReportController();