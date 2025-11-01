// src/routes/bookingRoutes.ts

import { Router } from 'express';
import { bookingController } from '@/controllers/bookingController.js';
import { authenticateToken, authorize } from '@/middleware/auth.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Bookings
 *   description: Operations for creating and managing bus bookings.
 */

// All booking routes require an authenticated user.
router.use(authenticateToken);

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a booking for the authenticated user on a specific bus and route.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [busId, routeId, fromStopId, toStopId, travelDate, seatCount]
 *             properties:
 *               busId: { type: integer }
 *               routeId: { type: integer }
 *               fromStopId: { type: integer }
 *               toStopId: { type: integer }
 *               travelDate: { type: string, format: date }
 *               seatCount: { type: integer, default: 1 }
 *     responses:
 *       '201': { description: "Booking created successfully." }
 *       '400': { description: "Invalid input or validation error." }
 *       '404': { description: "Bus or stops not found." }
 *       '409': { description: "Conflict - not enough available seats." }
 */
router.post('/', authorize(['passenger', 'admin']), bookingController.createBooking);

/**
 * @openapi
 * /api/bookings/my:
 *   get:
 *     summary: Get all bookings for the currently authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Filter bookings by status.
 *     responses:
 *       '200': { description: "A list of the user's bookings." }
 */
router.get('/my', bookingController.getMyBookings);

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a single booking by its ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The CUID of the booking.
 *     responses:
 *       '200': { description: "Detailed information about the booking." }
 *       '403': { description: "Forbidden - user not authorized to view this booking." }
 *       '404': { description: "Booking not found." }
 */
router.get('/:id', bookingController.getBookingById);

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     description: Allows the user who created the booking to cancel it.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The CUID of the booking to cancel.
 *     responses:
 *       '200': { description: "Booking cancelled successfully." }
 *       '403': { description: "Forbidden - user can only cancel their own bookings." }
 *       '404': { description: "Booking not found." }
 */
router.put('/:id/cancel', bookingController.cancelBooking);

export default router;