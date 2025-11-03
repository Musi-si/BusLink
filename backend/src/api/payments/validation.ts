import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const recordPaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    amount: z.number().positive("Amount must be a positive number"),
    method: z.nativeEnum(PaymentMethod),
  }),
});

export const initiatePaymentSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("A valid booking ID is required."),
    phoneNumber: z
      .string()
      .regex(
        /^07\d{8}$/,
        "Invalid Rwandan phone number format. Must be 07XXXXXXXX."
      ),
  }),
});
