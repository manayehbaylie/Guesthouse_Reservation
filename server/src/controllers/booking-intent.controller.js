import { z } from "zod";
import { claimBookingIntent, createBookingIntent } from "../services/booking-intent.service.js";
import { successResponse } from "../utils/response.js";

const createSchema = z.object({
  guesthouseId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().positive().default(1),
});
const claimSchema = z.object({ token: z.string().min(40).max(50) });

export const create = async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body || {});
    const intent = await createBookingIntent(input);
    return successResponse(res, intent, "Booking selection saved securely", 201);
  } catch (error) {
    next(error);
  }
};

export const claim = async (req, res, next) => {
  try {
    const { token } = claimSchema.parse(req.body || {});
    const booking = await claimBookingIntent(token, req.user.id);
    return successResponse(res, booking, "Booking selection restored");
  } catch (error) {
    next(error);
  }
};
