import { z } from "zod";

const ETHIOPIAN_BANKS = [
  "CBE",
  "Awash Bank",
  "Bank of Abyssinia",
  "Zemen Bank",
  "Dashen Bank",
  "PRIDE Microfinance",
  "Hibret Bank",
  "Oromia Bank",
  "Wegagen Bank",
];

const BANK_ACCOUNT_RULES = {
  CBE: {
    pattern: /^1000\d{9}$/,
    message: "CBE account number must be exactly 13 digits and start with 1000.",
  },
  "Awash Bank": {
    pattern: /^\d{14}$/,
    message: "Awash Bank account number must be exactly 14 digits.",
  },
  "Bank of Abyssinia": {
    pattern: /^\d{9}$/,
    message: "Bank of Abyssinia account number must be exactly 9 digits.",
  },
  "Zemen Bank": {
    pattern: /^\d{8,16}$/,
    message: "Zemen Bank account number must contain 8 to 16 digits.",
  },
  "Dashen Bank": {
    pattern: /^\d{8,16}$/,
    message: "Dashen Bank account number must contain 8 to 16 digits.",
  },
  "PRIDE Microfinance": {
    pattern: /^\d{13}$/,
    message: "PRIDE Microfinance account number must be exactly 13 digits.",
  },
  "Hibret Bank": {
    pattern: /^\d{8,16}$/,
    message: "Hibret Bank account number must contain 8 to 16 digits.",
  },
  "Oromia Bank": {
    pattern: /^\d{8,16}$/,
    message: "Oromia Bank account number must contain 8 to 16 digits.",
  },
  "Wegagen Bank": {
    pattern: /^(\d{8}|\d{13})$/,
    message: "Wegagen Bank account number must be exactly 8 or 13 digits.",
  },
};

export const getBankAccountValidationError = (bankName, accountNumber) => {
  const rule = BANK_ACCOUNT_RULES[bankName];
  return rule && !rule.pattern.test(accountNumber) ? rule.message : null;
};

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
      ["TELEBIRR", "CARD", "BANK_TRANSFER"],
      {
        errorMap: () => ({
          message:
            "Payment method must be TELEBIRR, CARD, or BANK_TRANSFER",
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
      } else {
        const accountNumberError = getBankAccountValidationError(
          data.bankName,
          data.accountNumber
        );

        if (accountNumberError) {
          ctx.addIssue({
            code: "custom",
            path: ["accountNumber"],
            message: accountNumberError,
          });
        }
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