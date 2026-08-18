import { z } from "zod";

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

  role: z.enum([
    "GUEST",
    "OWNER",
    "RECEPTIONIST",
    "ADMIN",
  ]),

  // Owner application information
  idNumber: z
    .string()
    .optional(),

  idType: z
    .string()
    .optional(),

  businessName: z
    .string()
    .optional(),

  businessPhone: z
    .string()
    .optional(),

  businessEmail: z
    .string()
    .email("Invalid business email")
    .optional()
    .or(z.literal("")),

  guesthouseName: z
    .string()
    .optional(),

  guesthouseAddress: z
    .string()
    .optional(),

  guesthouseCity: z
    .string()
    .optional(),

  guesthouseDescription: z
    .string()
    .optional(),

  businessLicenseNumber: z
    .string()
    .optional(),

  licenseDocument: z
    .string()
    .optional(),

  idDocument: z
    .string()
    .optional(),
}).superRefine((data, ctx) => {
  // Extra fields are required only when registering as OWNER.
  if (data.role === "OWNER") {
    if (!data.idNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["idNumber"],
        message: "Identification number is required",
      });
    }

    if (!data.idType?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["idType"],
        message: "Identification type is required",
      });
    }

    if (!data.businessName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Business name is required",
      });
    }

    if (!data.businessPhone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessPhone"],
        message: "Business phone is required",
      });
    }

    if (!data.guesthouseName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guesthouseName"],
        message: "Guesthouse name is required",
      });
    }

    if (!data.guesthouseAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guesthouseAddress"],
        message: "Guesthouse address is required",
      });
    }

    if (!data.guesthouseCity?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guesthouseCity"],
        message: "Guesthouse city is required",
      });
    }

    if (!data.guesthouseDescription?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guesthouseDescription"],
        message: "Guesthouse description is required",
      });
    }
  }
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});
