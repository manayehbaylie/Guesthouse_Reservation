ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('TELEBIRR', 'CARD', 'BANK_TRANSFER', 'CHAPA');

ALTER TABLE "Payment"
ALTER COLUMN "method" TYPE "PaymentMethod"
USING (
  CASE
    WHEN "method"::text = 'CBE_BIRR' THEN 'BANK_TRANSFER'
    ELSE "method"::text
  END
)::"PaymentMethod";

DROP TYPE "PaymentMethod_old";