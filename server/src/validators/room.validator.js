import { z } from "zod";

export const roomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),

  roomType: z.enum([
    "SINGLE",
    "DOUBLE",
    "TWIN",
    "FAMILY",
    "SUITE",
  ]),

  price: z.number().positive("Price must be greater than 0"),

  capacity: z.number().int().positive(),

  available: z.boolean().optional(),
});

export const roomUpdateSchema = roomSchema.partial();