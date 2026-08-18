import { z } from "zod";

const isParsableDate = (value) =>
  typeof value === "string" &&
  !Number.isNaN(new Date(value).getTime());

export const reservationSchema = z.object({
  checkIn: z
    .string()
    .refine(isParsableDate, {
      message: "checkIn must be a valid date (YYYY-MM-DD or ISO date-time)",
    }),

  checkOut: z
    .string()
    .refine(isParsableDate, {
      message: "checkOut must be a valid date (YYYY-MM-DD or ISO date-time)",
    }),

  roomId: z.number().int().positive(),
});