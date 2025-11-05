// src/controllers/stopController.ts

import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '@/config/prisma.js'
import { asyncHandler, AppError } from '@/middleware/errorHandler.js'
import { findNearbyStops, Location } from '@/utils/etaCalculator.js'

class StopController {
  /**
   * Get a single stop by its ID, including route info.
   * GET /api/stops/:id
   */
  getStopById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const stop = await prisma.stop.findUnique({
      where: { id: parseInt(id) },
      include: {
        route: { select: { id: true, name: true, color: true } },
      },
    })

    if (!stop) {
      throw new AppError('Stop not found', 404)
    }
    res.status(200).json({ success: true, data: stop })
  })

  /**
   * Find stops near a given geographic coordinate.
   * GET /api/stops/nearby?lat=...&lng=...
   */
  getNearbyStops = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 1000 } = req.query // Default 1km radius

    if (!lat || !lng) {
      throw new AppError('Latitude (lat) and longitude (lng) are required.', 400)
    }

    const location: Location = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
    }

    // Fetch all active stops to perform the search
    const allStops = await prisma.stop.findMany({
      where: { isActive: true },
    })

    // Use the utility function to filter and sort by distance
    const nearbyStops = findNearbyStops(location, allStops, parseInt(radius as string))

    res.status(200).json({ success: true, count: nearbyStops.length, data: nearbyStops })
  })

  /**
   * Search for stops by name or zone.
   * GET /api/stops/search?q=...
   */
  searchStops = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query

    if (!q || typeof q !== 'string' || q.length < 2) {
      throw new AppError('A search query (q) of at least 2 characters is required.', 400)
    }

    const where: Prisma.StopWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { zone: { contains: q, mode: 'insensitive' } },
      ],
    }

    const stops = await prisma.stop.findMany({
      where,
      take: parseInt(limit as string),
      include: {
        route: { select: { id: true, name: true, color: true } },
      },
    })

    res.status(200).json({ success: true, count: stops.length, data: stops })
  })
}

export const stopController = new StopController()