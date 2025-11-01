// src/routes/stopRoutes.ts

import { Router } from 'express';
import { stopController } from '@/controllers/stopController.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Stops
 *   description: Operations related to bus stops.
 */

/**
 * @openapi
 * /api/stops/nearby:
 *   get:
 *     summary: Find bus stops near a specific geographic location
 *     tags: [Stops]
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
 *         schema: { type: integer, default: 1000 }
 *         description: The search radius in meters.
 *     responses:
 *       '200':
 *         description: A list of stops found within the radius, sorted by distance.
 */
router.get('/nearby', stopController.getNearbyStops);

/**
 * @openapi
 * /api/stops/search:
 *   get:
 *     summary: Search for stops by name or zone
 *     tags: [Stops]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: The search query (at least 2 characters).
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Maximum number of stops to return.
 *     responses:
 *       '200':
 *         description: A list of stops matching the search query.
 */
router.get('/search', stopController.searchStops);

/**
 * @openapi
 * /api/stops/{id}:
 *   get:
 *     summary: Get details for a single stop
 *     tags: [Stops]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The numeric ID of the stop.
 *     responses:
 *       '200':
 *         description: Detailed information about the stop, including its route.
 *       '404':
 *         description: Stop not found.
 */
router.get('/:id', stopController.getStopById);


export default router;