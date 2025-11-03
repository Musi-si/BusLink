import { Router } from 'express';
import { NotificationController } from './controller';
import { authenticateToken } from '@/middleware/auth';

const router = Router();
const notificationController = new NotificationController();

/**
 * @openapi
 * tags:
 *   name: Notifications
 *   description: Managing user notifications for system events like appointment reminders.
 */

router.use(authenticateToken);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List current user's notifications
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     description: Retrieves all notifications for the currently authenticated user.
 *     responses:
 *       '200': { description: "A list of notifications." }
 */
router.get('/', notificationController.listUserNotifications);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 *     description: Marks a specific notification as read for the current user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: The UUID of the notification to mark as read.
 *     responses:
 *       '200': { description: "Notification updated successfully." }
 *       '403': { description: "Forbidden. You can only mark your own notifications." }
 *       '404': { description: "Notification not found." }
 */
router.patch('/:id/read', notificationController.markAsRead);

export default router;