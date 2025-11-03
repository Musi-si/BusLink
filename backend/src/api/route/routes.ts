// src/routes/routeRoutes.ts

import { Router } from 'express';
import { routeController } from '@/api/route/controller.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Routes
 *   description: Operations related to bus routes and their stops.
 */

/**
 * @openapi
 * /api/routes:
 *   get:
 *     summary: Get a list of all active routes
 *     tags: [Routes]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search routes by name.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: The number of routes to return per page.
 *     responses:
 *       '200':
 *         description: A paginated list of active routes with stop and bus counts.
 */
router.get('/', routeController.getAllRoutes);

/**
 * @openapi
 * /api/routes/{id}:
 *   get:
 *     summary: Get details for a single route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The numeric ID of the route.
 *       - in: query
 *         name: include_eta
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: "true"
 *         description: Whether to include real-time ETA calculations for buses on the route.
 *     responses:
 *       '200':
 *         description: Detailed information about the route, including its stops and all active buses with their ETAs.
 *       '404':
 *         description: Route not found.
 */
router.get('/:id', routeController.getRouteById);

/**
 * @openapi
 * /api/routes/{id}/stats:
 *   get:
 *     summary: Get statistics for a specific route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The numeric ID of the route.
 *     responses:
 *       '200':
 *         description: Key statistics for the route, such as total stops and bus counts.
 *       '404':
 *         description: Route not found.
 */
router.get('/:id/stats', routeController.getRouteStats);

export default router;