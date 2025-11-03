// src/routes/paymentRoutes.ts

import { Router } from 'express';
import { PaymentController } from '@/api/payments/controller.js';
import { authenticateToken, authorize } from '@/middleware/auth.js';
// Note: A 'validate' middleware would need to be created if you want input validation here.
// For now, we rely on controller-level validation.

const router = Router();
const paymentController = new PaymentController();

/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Endpoints for handling booking payments.
 */

// --- Public Webhook Route (No Auth) ---
router.post('/webhook/paypack', paymentController.handlePaypackWebhook);

// --- Protected Routes (Auth Required) ---
router.use(authenticateToken);

/**
 * @openapi
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate an automated mobile money payment for a booking
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Passenger to start the payment process for their booking.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, phoneNumber]
 *             properties:
 *               bookingId: { type: string, description: "The CUID of the booking to pay for." }
 *               phoneNumber: { type: string, example: "0781234567" }
 *     responses:
 *       '200': { description: "Payment initiated successfully." }
 */
router.post('/initiate', authorize(['passenger']), paymentController.initiatePayment);

/**
 * @openapi
 * /api/payments:
 *   post:
 *     summary: (Admin) Manually record a payment for a booking
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows an Admin to manually record a payment made via Cash or other means.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId: { type: string }
 *               amount: { type: number }
 *               method: { type: string, enum: [CASH, MOBILE_MONEY, INSURANCE] }
 *     responses:
 *       '201': { description: "Payment recorded successfully." }
 *       '403': { description: "Forbidden - requires admin role." }
 */
router.post('/', authorize(['admin']), paymentController.recordPayment);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     summary: View payment history
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves payment history. Passengers see their own payments; Admins see all.
 *     responses:
 *       '200': { description: "A list of payment records." }
 */
router.get('/', authorize(['passenger', 'admin']), paymentController.viewPaymentHistory);


export default router;