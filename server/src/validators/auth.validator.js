import { z } from "zod";

// ============================================================
// REGISTER SCHEMA
// ============================================================
// Owner registration only needs personal details (name, email,
// phone, password). Guesthouse fields are submitted separately
// from the Owner Dashboard after the account is created.
// ============================================================

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "Full name is required"),

  email: z
    .string()
    .email("Invalid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  phone: z
    .string()
    .min(10, "Phone number is required"),

  residentialAddress: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),

  role: z.enum(["GUEST", "OWNER"], {
    errorMap: () => ({
      message: "Role must be GUEST or OWNER",
    }),
  }),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
