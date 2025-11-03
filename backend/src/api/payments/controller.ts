// src/controllers/paymentController.ts

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "@/config/prisma.js";
import { AppError } from "@/middleware/errorHandler.js";
import { AuthRequest } from "@/types/index.js";
import { paypackService } from "@/services/paypack.js";
import { notificationService } from "@/services/notification.js";

export class PaymentController {
  /**
   * (Manual) Allows an Admin to record a payment made via Cash, etc.
   */
  async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId, amount, method } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return next(new AppError("Booking not found", 404));
      }

      // Use a transaction to update both payment and booking
      const [payment, updatedBooking] = await prisma.$transaction([
        prisma.payment.create({
          data: {
            bookingId,
            amount,
            method,
            status: "paid",
          },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentStatus: "paid",
            status: "confirmed",
          },
        }),
      ]);

      res.status(201).json({ status: "success", data: { payment, booking: updatedBooking } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiates an automated mobile money payment for a booking.
   */
  async initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
    const { bookingId, phoneNumber } = req.body;
    const passengerUserId = req.user!.id;

    try {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, userId: passengerUserId },
        include: { payment: true },
      });

      if (!booking) {
        return next(new AppError("Booking not found or you are not authorized to pay for it.", 404));
      }
      if (booking.payment?.status === "paid") {
        return next(new AppError("This booking has already been paid for.", 409));
      }
      if (booking.status === 'cancelled') {
        return next(new AppError("Cannot pay for a cancelled booking.", 400));
      }

      const amount = booking.totalFare;

      const payment = await prisma.$transaction(async (tx) => {
        if (booking.payment) {
          await tx.payment.delete({ where: { id: booking.payment.id } });
        }
        const newPayment = await tx.payment.create({
          data: {
            bookingId: booking.id,
            amount,
            method: "MOBILE_MONEY_AUTOMATED",
            status: "pending",
          },
        });
        const paypackResponse = await paypackService.cashin({
          number: phoneNumber,
          amount: amount.toNumber(),
        });
        return tx.payment.update({
          where: { id: newPayment.id },
          data: { transactionRef: paypackResponse.ref },
        });
      });

      res.status(200).json({
        status: "success",
        message: "Payment initiated. Please confirm the transaction on your phone.",
        data: { paymentId: payment.id },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handles incoming webhooks from the Paypack service.
   */
  async handlePaypackWebhook(req: Request, res: Response, next: NextFunction) {
    const signature = req.get("x-paypack-signature");
    const rawBody = (req as any).rawBody;

    try {
      paypackService.verifyWebhookSignature(signature, rawBody);

      const { data } = req.body;
      if (!data || !data.ref || !data.status) {
        return next(new AppError("Invalid webhook payload.", 400));
      }

      const payment = await prisma.payment.findUnique({
        where: { transactionRef: data.ref },
        include: {
          booking: {
            include: { user: true, bus: { include: { driver: true } } },
          },
        },
      });
      if (!payment) {
        return res.status(200).send("Webhook received, but transaction not found.");
      }
      if (payment.status !== "pending") {
        return res.status(200).send("Webhook already processed.");
      }

      const newStatus = data.status === "successful" ? "paid" : "failed";
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newStatus },
        });
        if (newStatus === "paid") {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { paymentStatus: "paid", status: "confirmed" },
          });
        }
      });
      
      if (newStatus === "paid") {
        const passenger = payment.booking.user;
        const driver = payment.booking.bus.driver;

        await notificationService.createNotification(
          passenger.id,
          `Your payment of RWF ${payment.amount} for booking #${payment.booking.bookingReference} is confirmed.`,
          'SUCCESS'
        );
        if (driver) {
          await notificationService.createNotification(
            driver.userId,
            `A new booking (#${payment.booking.bookingReference}) has been paid for on your bus.`,
          );
        }
      }

      res.status(200).send("Webhook processed successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * View payment history for the authenticated user.
   */
  async viewPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const where: Prisma.PaymentWhereInput = {};
      const user = req.user!;

      if (user.role === "passenger") {
        where.booking = { userId: user.id };
      } else if (user.role !== "admin") {
        return res.status(200).json({ status: "success", data: [] });
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: { bookingReference: true, travelDate: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.status(200).json({ status: "success", results: payments.length, data: payments });
    } catch (error) {
      next(error);
    }
  }
}