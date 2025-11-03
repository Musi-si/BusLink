import { Response, NextFunction } from 'express';
import prisma from '@/config/prisma.js';
import AppError from '@/utils/AppError.js';
import { AuthRequest } from '@/types/index.js';

export class NotificationController {
  // List notifications for the currently logged-in user
  async listUserNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ status: 'success', data: notifications });
    } catch (error) {
      next(error);
    }
  }

  // Mark a notification as read
  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // const { id } = req.params;
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification) {
        return next(new AppError('Notification not found', 404));
      }
      if (notification.userId !== userId) {
        return next(new AppError('You are not authorized to modify this notification.', 403));
      }

      const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      res.status(200).json({ status: 'success', data: updatedNotification });
    } catch (error) {
      next(error);
    }
  }
}