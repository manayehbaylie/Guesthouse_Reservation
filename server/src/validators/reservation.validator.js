import { z } from "zod";

export const reservationSchema = z.object({
  checkIn: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Check-in date must be in YYYY-MM-DD format"
  ),

  checkOut: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Check-out date must be in YYYY-MM-DD format"
  ),

  roomId: z.number().int().positive(),
});