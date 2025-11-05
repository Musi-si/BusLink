// src/controllers/routeController.ts

import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '@/config/prisma.js'
import { asyncHandler, AppError } from '@/middleware/errorHandler.js'
import { calculateRouteETAs, BusLocation } from '@/utils/etaCalculator.js'

class RouteController {
  /**
   * Get all active routes with pagination and search.
   * GET /api/routes
   */
  getAllRoutes = asyncHandler(async (req: Request, res: Response) => {
    const { page = '1', limit = '20', search } = req.query
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Prisma.RouteWhereInput = { isActive: true }
    if (search && typeof search === 'string') {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [routes, totalRoutes] = await prisma.$transaction([
      prisma.route.findMany({
        where,
        take: limitNum,
        skip,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              stops: { where: { isActive: true } },
              buses: { where: { status: { in: ['moving', 'idle', 'arrived'] } } },
            },
          },
        },
      }),
      prisma.route.count({ where }),
    ])

    const formattedRoutes = routes.map(route => ({
      id: route.id,
      name: route.name,
      description: route.description,
      color: route.color,
      stopsCount: route._count.stops,
      activeBusesCount: route._count.buses,
    }))

    res.status(200).json({
      success: true,
      data: formattedRoutes,
      pagination: {
        total: totalRoutes,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalRoutes / limitNum),
      },
    })
  })

  /**
   * Get a single route by ID, including its stops and active buses.
   * GET /api/routes/:id
   */
  getRouteById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { include_eta = 'true' } = req.query

    const route = await prisma.route.findUnique({
      where: { id: parseInt(id) },
      include: {
        stops: { where: { isActive: true }, orderBy: { stopOrder: 'asc' } },
        buses: {
          where: { status: { in: ['moving', 'idle', 'arrived'] } },
          include: { driver: { select: { id: true, name: true, rating: true } } },
        },
      },
    })

    if (!route) {
      throw new AppError('Route not found', 404)
    }
    
    // Create a mutable copy of the route to add ETAs
    const responseData = { ...route }

    if (include_eta === 'true' && responseData.buses.length > 0 && responseData.stops.length > 0) {
      // Add ETA calculations to each bus on the route
      responseData.buses = responseData.buses.map(bus => {
        if (!bus.lastLocationLat || !bus.lastLocationLng) return bus

        const busLocation: BusLocation = {
          lat: bus.lastLocationLat,
          lng: bus.lastLocationLng,
          speedKmh: bus.lastSpeedKmh ? bus.lastSpeedKmh.toNumber() : 25,
        }

        const etas = calculateRouteETAs(busLocation, responseData.stops)
        return { ...bus, etas } // Attach the calculated ETAs to the bus object
      }) as any // Cast to any to add the 'etas' property
    }

    res.status(200).json({ success: true, data: responseData })
  })

  /**
   * Get statistics for a specific route.
   * GET /api/routes/:id/stats
   */
  getRouteStats = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const route = await prisma.route.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            stops: { where: { isActive: true } },
            buses: true, // Total buses on this route
          },
        },
      },
    })

    if (!route) {
      throw new AppError('Route not found', 404)
    }

    // Get active buses count separately
    const activeBusesCount = await prisma.bus.count({
      where: { routeId: parseInt(id), status: { in: ['moving', 'idle', 'arrived'] } },
    })

    res.status(200).json({
      success: true,
      data: {
        routeId: route.id,
        routeName: route.name,
        stats: {
          totalStops: route._count.stops,
          totalBuses: route._count.buses,
          activeBuses: activeBusesCount,
          distanceKm: route.distanceKm,
          estimatedDurationMinutes: route.estimatedDurationMinutes,
        },
      },
    })
  })
}

export const routeController = new RouteController()