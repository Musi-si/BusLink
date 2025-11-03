import prisma from "@/config/prisma";
import { NotificationType } from "@prisma/client";

class NotificationService {
  async createNotification(
    userId: string,
    message: string,
    type: NotificationType
  ) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          message,
          type,
        },
      });
      console.log(
        `[INFO] Notification created for user ${userId}: "${message}"`
      );
    } catch (error) {
      console.error(
        `[ERROR] Failed to create notification for user ${userId}`,
        error
      );
    }
  }
}

export const notificationService = new NotificationService();
