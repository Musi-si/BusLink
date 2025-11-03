import { Router } from "express";
import { PaymentController } from "@/api/payments/controller.js";
import { authenticateToken, authorize } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { recordPaymentSchema, initiatePaymentSchema } from "@/api/payments/validation.js";

const router = Router();
const paymentController = new PaymentController();

/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Endpoints for recording and viewing consultation payments.
 */

/**
 * @openapi
 * /payments/initiate:
 *   post:
 *     summary: Initiate an automated mobile money payment for an booking
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Passenger to start a payment process for a confirmed booking. This triggers a push notification to their phone. The API response contains a paymentId that the client can use to listen for real-time updates via WebSockets.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, phoneNumber]
 *             properties:
 *               bookingId: { type: string, format: uuid, description: "The UUID of the booking to pay for." }
 *               phoneNumber: { type: string, example: "0781234567", description: "The Rwandan mobile money number to charge." }
 *     responses:
 *       '200':
 *          description: "Payment initiated successfully. The user should confirm the payment on their phone."
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          status: { type: string, example: "success" }
 *                          message: { type: string }
 *                          data:
 *                              type: object
 *                              properties:
 *                                  paymentId: { type: string, format: uuid }
 *       '403': { description: "Forbidden. Not authorized." }
 *       '404': { description: "booking not found or does not belong to the user." }
 *       '409': { description: "Conflict. The booking has already been paid for." }
 */
router.post( "/initiate", authenticateToken, authorize(["PASSENGER"]), validate(initiatePaymentSchema), paymentController.initiatePayment);

/**
 * @openapi
 * /payments/webhook/paypack:
 *   post:
 *     summary: Webhook for Paypack to send payment status updates
 *     tags: [Payments]
 *     description: (For Paypack Use Only) This public endpoint receives real-time transaction status updates from Paypack. It is secured via signature verification.
 *     requestBody:
 *       description: The webhook payload sent by Paypack.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event: { type: string, example: "transaction.updated" }
 *               data: { type: object }
 *     responses:
 *       '200': { description: "Webhook processed successfully." }
 *       '401': { description: "Invalid signature." }
 *       '500': { description: "Error processing webhook." }
 */
router.post("/webhook/paypack", paymentController.handlePaypackWebhook);

/**
 * @openapi
 * /payments:
 *   post:
 *     summary: (Manual) Record a payment for an booking
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Allows a Receptionist to manually record a payment made via Cash, Insurance, or non-automated Mobile Money.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId: { type: string, format: uuid }
 *               amount: { type: number, example: 25000 }
 *               method: { type: string, enum: [CASH, MOBILE_MONEY, INSURANCE], example: "CASH" }
 *     responses:
 *       '201': { description: "Payment recorded successfully." }
 *       '403': { description: "Forbidden. Not authorized." }
 *       '404': { description: "booking not found." }
 */
router.post( "/", authenticateToken, authorize(["RECEPTIONIST"]), validate(recordPaymentSchema), paymentController.recordPayment);

/**
 * @openapi
 * /payments:
 *   get:
 *     summary: View payment history
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves payment history. The results are automatically filtered based on the user's role (Passenger sees own, Receptionist/Admin sees for their hospital).
 *     responses:
 *       '200': { description: "A list of payments." }
 */
router.get( "/", authenticateToken, authorize(["PASSENGER"]), paymentController.viewPaymentHistory);

export default router;
