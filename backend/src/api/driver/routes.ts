// src/routes/driverRoutes.ts

import { Router } from 'express';
import { driverController } from '@/api/driver/controller.js';
import { authenticateToken, authorize } from '@/middleware/auth.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Driver
 *   description: Endpoints specifically for authenticated drivers to manage their trips, view bookings, and see their assigned bus.
 */

// All routes in this file are for authenticated drivers only.
router.use(authenticateToken, authorize(['driver']));

/**
 * @openapi
 * /api/driver/trips:
 *   get:
 *     summary: Get all past and current trips for the authenticated driver
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of the driver's trips.
 *       '401':
 *         description: Unauthorized.
 *       '403':
 *         description: Forbidden - user is not a driver.
 */
router.get('/trips', driverController.getDriverTrips);

/**
 * @openapi
 * /api/driver/my-bus:
 *   get:
 *     summary: Get detailed information about the bus currently assigned to the driver
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: The driver's assigned bus and its route details.
 *       '404':
 *         description: No bus is assigned to the driver.
 */
router.get('/my-bus', driverController.getActiveBusForDriver);

/**
 * @openapi
 * /api/driver/my-bus/bookings:
 *   get:
 *     summary: Get all bookings for the driver's currently assigned bus
 *     tags: [Driver]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of bookings for the driver's bus.
 *       '404':
 *         description: No bus is assigned to the driver.
 */
router.get('/my-bus/bookings', driverController.getBusBookings);
// Receive GPS/location updates from the driver (browser/mobile)
router.patch('/update-location', driverController.updateLocation);

export default router;