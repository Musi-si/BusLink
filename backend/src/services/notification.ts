// src/services/notificationService.ts

import prisma from "@/config/prisma.js";
import logger from "@/utils/logger.js";
import { socketManager } from "@/services/socket.js"; // Assuming a way to notify user in real-time

class NotificationService {
  async createNotification(
    userId: number,
    message: string,
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO'
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          message,
          type,
        },
      });
      logger.info(`Notification created for user ${userId}: "${message}"`);
      
      // Optional: Emit a real-time event to the specific user if they are connected
      socketManager.notifyUser(userId, 'new_notification', notification);

    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}`, error);
    }
  }
}

export const notificationService = new NotificationService();