import { z } from "zod";

export const guesthouseSchema = z.object({
  name: z.string().min(3, "Name is required"),

  address: z.string().min(3, "Address is required"),

  city: z.string().min(2, "City is required"),

  description: z
    .string()
    .min(10, "Description is too short"),

  image: z.string().optional(),
});