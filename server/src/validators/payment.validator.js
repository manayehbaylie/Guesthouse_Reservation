import { z } from "zod";

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "Dashen Bank",
  "PRIDE Microfinance",
];

export const paymentSchema = z
  .object({
    reservationId: z.coerce
      .number()
      .int()
      .positive("Reservation ID is required"),

    amount: z.coerce
      .number()
      .positive("Payment amount must be greater than 0"),

    paymentMethod: z.enum(
      ["TELEBIRR", "BANK_TRANSFER"],
      {
        errorMap: () => ({
          message:
            "Payment method must be TELEBIRR or BANK_TRANSFER",
        }),
      }
    ),

    /*
     * Required when using Telebirr
     */
    mobileNumber: z
      .string()
      .trim()
      .optional(),

    /*
     * Required when using bank transfer
     */
    bankName: z
      .string()
      .trim()
      .optional(),

    /*
     * Required when using bank transfer
     */
    accountNumber: z
      .string()
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    /*
     * ================================
     * TELEBIRR VALIDATION
     * ================================
     */
    if (data.paymentMethod === "TELEBIRR") {
      if (!data.mobileNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["mobileNumber"],
          message:
            "Mobile number is required for Telebirr.",
        });
      } else {
        const phone = data.mobileNumber.replace(/\s+/g, "");

        const validPhone =
          /^(09\d{8}|\+2519\d{8})$/.test(phone);

        if (!validPhone) {
          ctx.addIssue({
            code: "custom",
            path: ["mobileNumber"],
            message:
              "Enter a valid Ethiopian mobile number.",
          });
        }
      }
    }

    /*
     * ================================
     * BANK TRANSFER VALIDATION
     * ================================
     */
    if (data.paymentMethod === "BANK_TRANSFER") {
      if (!data.bankName) {
        ctx.addIssue({
          code: "custom",
          path: ["bankName"],
          message:
            "Bank name is required for bank transfer.",
        });
      } else if (
        !ETHIOPIAN_BANKS.includes(data.bankName)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["bankName"],
          message:
            "Please select a supported Ethiopian bank.",
        });
      }

      if (!data.accountNumber) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message:
            "Account number is required for bank transfer.",
        });
      } else if (
        !/^[0-9]{6,20}$/.test(
          data.accountNumber
        )
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message:
            "Account number must contain 6 to 20 digits.",
        });
      }
    }
  });

export const paymentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "PAID",
    "FAILED",
  ]),
});

export { ETHIOPIAN_BANKS };