import { z } from "zod";

export const reservationSchema = z.object({
  checkIn: z.string().datetime(),

  checkOut: z.string().datetime(),

  roomId: z.number().int().positive(),
});