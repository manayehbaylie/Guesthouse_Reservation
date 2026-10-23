import { z } from "zod";
import { REGISTRATION_ID_TYPES } from "../../../shared/registration-options.mjs";

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
    .trim()
    .min(3, "Full name must be at least 3 characters.")
    .max(120, "Full name is too long."),

  email: z
    .string()
    .max(254, "Please enter a valid Gmail address.")
    .optional(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
  confirmPassword: z.string().max(128, "Password is too long."),

  phone: z
    .string()
    .min(1, "Phone number is required.")
    .max(40, "Please enter a valid Ethiopian phone number."),

  residentialAddress: z.string().max(300, "Residential address is too long.").optional(),
  idType: z.string().max(80, "Please select your ID type.").optional().refine(
    (value) => !value || REGISTRATION_ID_TYPES.includes(value),
    "Please select your ID type."
  ),
  idNumber: z.string().max(120, "ID number is too long.").optional(),
  agreedToTerms: z.literal(true, { error: "Please agree to the Terms of Service and Privacy Policy." }),

  role: z.enum(["GUEST", "OWNER"], {
    error: "Role must be GUEST or OWNER.",
  }),
}).superRefine((data, context) => {
  if (data.role === "OWNER" && !data.email?.trim()) {
    context.addIssue({ code: "custom", path: ["email"], message: "Email is required for owner accounts." });
  }
  if (data.role === "OWNER" && !data.residentialAddress?.trim()) {
    context.addIssue({ code: "custom", path: ["residentialAddress"], message: "Residential address is required for owner accounts." });
  }
  if (data.role === "OWNER" && !data.idType?.trim()) {
    context.addIssue({ code: "custom", path: ["idType"], message: "ID type is required for owner accounts." });
  }
  if (data.role === "OWNER" && !data.idNumber?.trim()) {
    context.addIssue({ code: "custom", path: ["idNumber"], message: "ID number is required for owner accounts." });
  }
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  }
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address.").max(254).optional(),
  phone: z.string().max(40).optional(),
  password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
}).superRefine((data, context) => {
  if (Boolean(data.email) === Boolean(data.phone)) {
    context.addIssue({ code: "custom", path: ["email"], message: "Enter an email address or phone number." });
  }
});
