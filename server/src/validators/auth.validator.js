import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(9, "Phone number must be at least 9 digits"),
  role: z.enum(["GUEST", "OWNER", "RECEPTIONIST", "ADMIN"]).default("GUEST"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6),
});