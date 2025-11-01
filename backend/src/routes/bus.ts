// src/routes/busRoutes.ts

import { Router } from 'express';
import { busController } from '@/controllers/busController.js';
import { authenticateToken, authorize } from '@/middleware/auth.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Buses
 *   description: Operations related to buses, including real-time tracking and management.
 */

/**
 * @openapi
 * /api/buses:
 *   get:
 *     summary: Get a list of all buses
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [idle, moving, arrived, offline, maintenance] }
 *         description: Filter buses by their current status.
 *       - in: query
 *         name: routeId
 *         schema: { type: integer }
 *         description: Filter buses by their assigned route ID.
 *     responses:
 *       '200':
 *         description: A list of all buses matching the criteria.
 */
router.get('/', busController.getAllBuses);

/**
 * @openapi
 * /api/buses/active:
 *   get:
 *     summary: Get a list of all active buses
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: routeId
 *         schema: { type: integer }
 *         description: Filter active buses by their assigned route ID.
 *     responses:
 *       '200':
 *         description: A list of active buses (status is moving, idle, or arrived).
 */
router.get('/active', busController.getActiveBuses);

/**
 * @openapi
 * /api/buses/nearby:
 *   get:
 *     summary: Find buses near a specific geographic location
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, format: float }
 *         description: The latitude of the search center.
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, format: float }
 *         description: The longitude of the search center.
 *       - in: query
 *         name: radius
 *         schema: { type: integer, default: 2000 }
 *         description: The search radius in meters.
 *     responses:
 *       '200':
 *         description: A list of buses found within the specified radius.
 */
router.get('/nearby', busController.getNearbyBuses);

/**
 * @openapi
 * /api/buses/location:
 *   post:
 *     summary: Update a bus's location (for authenticated drivers)
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     description: Authenticated drivers use this endpoint to send their GPS coordinates.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number, format: float }
 *               longitude: { type: number, format: float }
 *               speedKmh: { type: number, format: float }
 *     responses:
 *       '200': { description: "Location updated successfully." }
 *       '401': { description: "Unauthorized." }
 *       '403': { description: "Forbidden - user is not a driver." }
 *       '404': { description: "No bus found assigned to the driver." }
 */
router.post(
  '/location',
  authenticateToken,
  authorize(['driver']),
  busController.updateBusLocation
);

/**
 * @openapi
 * /api/buses/{id}:
 *   get:
 *     summary: Get detailed information for a single bus
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The numeric ID of the bus.
 *     responses:
 *       '200':
 *         description: Detailed information about the bus.
 *       '404':
 *         description: Bus not found.
 */
router.get('/:id', busController.getBusById);

/**
 * @openapi
 * /api/buses/{id}/progress:
 *   get:
 *     summary: Get the real-time progress of a bus along its route
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The numeric ID of the bus.
 *     responses:
 *       '200':
 *         description: The bus's current progress, including percentage, current/next stops, and ETAs.
 *       '404':
 *         description: Bus or its route not found.
 */
router.get('/:id/progress', busController.getBusProgress);

/**
 * @openapi
 * /api/buses/{id}/history:
 *   get:
 *     summary: Get the recent location history for a bus
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The numeric ID of the bus.
 *       - in: query
 *         name: hours
 *         schema: { type: integer, default: 24 }
 *         description: The number of past hours to retrieve history for.
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 100 }
 *         description: Max number of location points to return.
 *     responses:
 *       '200':
 *         description: A list of historical location points for the bus.
 *       '404':
 *         description: Bus not found.
 */
router.get('/:id/history', busController.getBusLocationHistory);


export default router;