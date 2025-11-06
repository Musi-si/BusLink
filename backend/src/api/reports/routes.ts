// src/routes/reportRoutes.ts

import { Router } from 'express';
import { reportController } from '@/api/reports/controller.js';
import { authenticateToken, authorize } from '@/middleware/auth.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Endpoints for generating analytics and summary reports. All endpoints require authentication.
 */

// All report routes require authentication.
router.use(authenticateToken);

/**
 * @openapi
 * /api/reports/system:
 *   get:
 *     summary: Get a system-wide report (Admin only)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves platform-wide analytics like total users, buses, bookings, and revenue.
 *     responses:
 *       '200': { description: "System-wide analytics report." }
 *       '403': { description: "Forbidden - requires admin role." }
 */
router.get('/system', authorize(['admin']), reportController.getSystemReport);

/**
 * @openapi
 * /api/reports/route/{id}:
 *   get:
 *     summary: Get a report for a specific route (Admin only)
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves key performance indicators for a single route.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: The numeric ID of the route.
 *     responses:
 *       '200': { description: "Route performance report." }
 *       '403': { description: "Forbidden - requires admin role." }
 *       '404': { description: "Route not found." }
 */
router.get('/route/:id', authorize(['admin']), reportController.getRouteReport);

/**
 * @openapi
 * /api/reports/passenger/me:
 *   get:
 *     summary: Get the current passenger's personalized report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves a summary of the authenticated passenger's activities.
 *     responses:
 *       '200': { description: "Passenger's personalized report." }
 *       '403': { description: "Forbidden - requires passenger role." }
 */
router.get('/passenger/me', authorize(['passenger']), reportController.getPassengerReport);

/**
 * @openapi
 * /api/reports/driver/me:
 *   get:
 *     summary: Get the current driver's personalized report
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves a summary of the authenticated driver's performance metrics.
 *     responses:
 *       '200': { description: "Driver's personalized report." }
 *       '403': { description: "Forbidden - requires driver role." }
 *       '404': { description: "Driver profile not found." }
 */
router.get('/driver/me', authorize(['driver']), reportController.getDriverReport);

export default router;