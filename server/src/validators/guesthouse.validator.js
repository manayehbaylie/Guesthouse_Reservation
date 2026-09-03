import { z } from "zod";

export const guesthouseSchema = z.object({
  name: z.string().min(2, "Name is required"),

  address: z.string().min(2, "Address is required"),

  city: z.string().min(2, "City is required"),

  description: z.string().optional().or(z.literal("")),

  image: z.any().optional(),
});