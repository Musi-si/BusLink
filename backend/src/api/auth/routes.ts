// routes/authRoutes.ts

import express, { Router } from 'express'
import { AuthController } from '@/api/auth/controller.js'
import { authenticateToken } from '@/middleware/auth.js'
import { validate } from '@/middleware/validate.js'
import rateLimit from 'express-rate-limit'

const router: Router = express.Router()
const authController = new AuthController()

// Rate limiting for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpassword123
 *               role:
 *                 type: string
 *                 enum: [passenger, driver]
 *                 default: passenger
 *                 example: driver
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               license_number:
 *                 type: string
 *                 description: Required if role is 'driver'
 *                 example: "DL12345"
 *               vehicle_plate:
 *                 type: string
 *                 description: Required if role is 'driver'
 *                 example: "ABC-123"
 *     responses:
 *       '201':
 *         description: Verification email sent successfully.
 *       '400':
 *         description: User already exists or invalid input.
 *       '500':
 *         description: Internal server error.
 */
router.post('/register', authLimiter, authController.register)

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpassword123
 *     responses:
 *       '200':
 *         description: Login successful. Returns a JWT token and user object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       '400':
 *         description: Invalid email or password.
 *       '401':
 *         description: Email not verified.
 */
router.post('/login', authLimiter, authController.login)

/**
 * @openapi
 * /api/auth/verify:
 *   get:
 *     summary: Verify a user's email address via a token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to the user's email.
 *     responses:
 *       '200':
 *         description: Returns an HTML page indicating success and auto-redirects to the login page.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       '400':
 *         description: Invalid or expired token.
 */
router.get('/verify', authController.verify)

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com" }
 *     responses:
 *       '200': { description: "If a user with that email exists, an OTP has been sent." }
 */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       '200':
 *         description: "OTP verified successfully. Returns a passwordResetToken."
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 passwordResetToken: { type: string }
 *       '400': { description: "Invalid or expired OTP." }
 */
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with passwordResetToken
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passwordResetToken: { type: string }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       '200': { description: "Password reset successfully." }
 *       '400': { description: "Invalid or expired password reset token." }
 */
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     summary: Change current user's password
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       '200': { description: "Password changed successfully." }
 *       '401': { description: "Incorrect current password." }
 */
router.patch('/change-password', authenticateToken, authController.changePassword);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the profile of the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isEmailVerified:
 *                   type: boolean
 *       '401':
 *         description: Unauthorized, token is missing or invalid.
 *       '404':
 *         description: User not found.
 */
router.get('/me', authenticateToken, authController.me)

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     description: In a stateless JWT system, this endpoint serves as a formal signal for the client to clear the user's token. The server doesn't invalidate the token but confirms the logout action.
 *     responses:
 *       '200':
 *         description: Successfully logged out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully.
 *       '401':
 *         description: Unauthorized, token is missing or invalid.
 */
router.post('/logout', authenticateToken, authController.logout)

export default router