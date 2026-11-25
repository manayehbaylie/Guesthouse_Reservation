import { z } from "zod";

const isParsableDate = (value) =>
  typeof value === "string" &&
  !Number.isNaN(new Date(value).getTime());

export const reservationSchema = z.object({
  checkIn: z
    .string()
    .optional()
    .refine(isParsableDate, {
      message: "checkIn must be a valid date (YYYY-MM-DD or ISO date-time)",
    }),

  checkOut: z
    .string()
    .optional()
    .refine(isParsableDate, {
      message: "checkOut must be a valid date (YYYY-MM-DD or ISO date-time)",
    }),

  roomId: z.number().int().positive().optional(),
  numberOfGuests: z.number().int().positive().optional(),
  bookingIntentToken: z.string().regex(/^[A-Za-z0-9_-]{40,50}$/).optional(),
}).superRefine((data, context) => {
  if (data.bookingIntentToken) return;
  if (!data.checkIn) context.addIssue({ code: "custom", path: ["checkIn"], message: "checkIn is required." });
  if (!data.checkOut) context.addIssue({ code: "custom", path: ["checkOut"], message: "checkOut is required." });
  if (!data.roomId) context.addIssue({ code: "custom", path: ["roomId"], message: "roomId is required." });
});