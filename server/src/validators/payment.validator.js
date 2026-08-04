import { z } from "zod";

export const paymentSchema = z.object({
  reservationId: z.number().int().positive(),

  amount: z.number().positive(),

  paymentMethod: z.enum([
    "CASH",
    "TELEBIRR",
    "BANK",
    "CARD",
  ]),
});