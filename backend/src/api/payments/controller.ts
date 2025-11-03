import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "@/config/prisma";
import AppError from "@/utils/AppError";
import { AuthRequest } from "@/types";
import { paypackService } from "@/services/paypack";
import { socketService } from "@/config/socket";
import { notificationService } from "@/services/notification";

export class PaymentController {
  async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { appointmentId, amount, method } = req.body;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { patientId: true },
      });

      if (!appointment) {
        return next(new AppError("Appointment not found", 404));
      }

      const payment = await prisma.payment.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          amount,
          method,
          status: "PAID",
        },
      });
      res.status(201).json({ status: "success", data: payment });
    } catch (error) {
      next(error);
    }
  }

  async initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
    const { appointmentId, phoneNumber } = req.body;
    const patientUserId = req.user!.id;

    try {
      const patient = await prisma.patient.findUnique({
        where: { userId: patientUserId },
      });
      if (!patient) {
        return next(new AppError("Patient profile not found.", 404));
      }

      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, patientId: patient.id },
        include: { doctor: true, payment: true },
      });

      if (!appointment) {
        return next(
          new AppError(
            "Appointment not found or you are not authorized to pay for it.",
            404
          )
        );
      }
      if (appointment.payment?.status === "PAID") {
        return next(
          new AppError("This appointment has already been paid for.", 409)
        );
      }

      const amount = appointment.doctor.consultationFee;

      // Use a transaction to ensure atomicity
      const payment = await prisma.$transaction(async (tx) => {
        // If a failed payment exists, delete it to create a new one.
        if (appointment.payment) {
          await tx.payment.delete({ where: { id: appointment.payment.id } });
        }

        // 1. Create a PENDING payment record in our database
        const newPayment = await tx.payment.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            amount,
            method: "MOBILE_MONEY_AUTOMATED",
            status: "PENDING",
          },
        });

        // 2. Initiate the payment with Paypack
        const paypackResponse = await paypackService.cashin({
          number: phoneNumber,
          amount: amount.toNumber(),
        });

        // 3. Update our record with Paypack's reference
        const updatedPayment = await tx.payment.update({
          where: { id: newPayment.id },
          data: { transactionRef: paypackResponse.ref },
        });
        return updatedPayment;
      });

      res.status(200).json({
        status: "success",
        message: "Payment initiated. Please confirm on your phone.",
        data: { paymentId: payment.id },
      });
    } catch (error) {
      next(error);
    }
  }
  async handlePaypackWebhook(req: Request, res: Response, next: NextFunction) {
    const signature = req.get("x-paypack-signature");
    // The 'rawBody' is attached by our custom middleware in src/index.ts
    const rawBody = (req as any).rawBody;

    try {
      // 1. SECURITY: Always verify the signature first
      paypackService.verifyWebhookSignature(signature, rawBody);

      const { data } = req.body;
      if (!data || !data.ref || !data.status) {
        return next(new AppError("Invalid webhook payload.", 400));
      }
      console.log(`[INFO] Received valid Paypack webhook for ref: ${data.ref}`);

      // 2. Find the payment by the unique transaction reference
      const payment = await prisma.payment.findUnique({
        where: { transactionRef: data.ref },
        include: {
          patient: {
            select: { userId: true, user: { select: { fullName: true } } },
          },
          appointment: {
            select: {
              doctor: {
                select: { userId: true, user: { select: { fullName: true } } },
              },
            },
          },
        },
      });
      if (!payment) {
        console.warn(`[WARN] Payment with ref ${data.ref} not found.`);
        // Respond 200 OK so Paypack doesn't retry for a transaction we don't know about.
        return res
          .status(200)
          .send("Webhook received, but transaction not found.");
      }

      // 3. Idempotency: Only process if the payment is still pending
      if (payment.status !== "PENDING") {
        console.log(
          `[INFO] Webhook for ref ${data.ref} already processed. Current status: ${payment.status}.`
        );
        return res.status(200).send("Webhook already processed.");
      }

      // 4. Update payment status based on webhook data
      const newStatus = data.status === "successful" ? "PAID" : "FAILED";
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: newStatus },
      });
      console.log(`[INFO] Payment ${payment.id} updated to ${newStatus}`);

      // 5. Notify the frontend client via WebSocket
      socketService.notifyPaymentUpdate(payment.id, newStatus);

      // 6. Create notifications for patient and doctor on successful payment
      if (newStatus === "PAID") {
        const patientName = payment.patient.user.fullName;
        const doctorName =
          payment.appointment.doctor?.user.fullName || "the doctor";

        await notificationService.createNotification(
          payment.patient.userId,
          `Your payment of RWF ${payment.amount} for the appointment with ${doctorName} has been confirmed.`,
          "INFO"
        );
        if (payment.appointment.doctor) {
          await notificationService.createNotification(
            payment.appointment.doctor.userId,
            `Payment of RWF ${payment.amount} has been received from ${patientName} for your upcoming appointment.`,
            "INFO"
          );
        }
      }

      // 7. Acknowledge the webhook
      res.status(200).send("Webhook processed successfully.");
    } catch (error) {
      next(error);
    }
  }

  async viewPaymentHistory(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const where: Prisma.PaymentWhereInput = {};
      const user = req.user!;

      if (user.role === "PATIENT") {
        const patient = await prisma.patient.findUnique({
          where: { userId: user.id },
        });
        if (!patient)
          return res.status(200).json({ status: "success", data: [] });
        where.patientId = patient.id;
      } else if (
        user.role === "RECEPTIONIST" ||
        user.role === "HOSPITAL_ADMIN"
      ) {
        // Allow Hospital Admins to see payments for their hospital as well
        const staff = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            receptionistProfile: true,
            doctorProfile: {
              include: { hospital: { select: { adminId: true } } },
            },
          },
        });
        const hospitalId =
          staff?.receptionistProfile?.hospitalId ||
          staff?.doctorProfile?.hospitalId;
        if (!hospitalId)
          return res.status(200).json({ status: "success", data: [] });
        where.appointment = { hospitalId: hospitalId };
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          appointment: { select: { id: true, appointmentDate: true } },
          patient: { select: { user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      res
        .status(200)
        .json({ status: "success", results: payments.length, data: payments });
    } catch (error) {
      next(error);
    }
  }
}
