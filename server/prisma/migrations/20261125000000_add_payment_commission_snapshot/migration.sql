ALTER TABLE "Payment"
ADD COLUMN "commissionRate" DOUBLE PRECISION,
ADD COLUMN "commissionAmount" DOUBLE PRECISION;

UPDATE "Payment" AS payment
SET
  "commissionRate" = COALESCE((SELECT "commissionRate" FROM "SystemSetting" WHERE id = 1), 10),
  "commissionAmount" = ROUND((payment.amount * COALESCE((SELECT "commissionRate" FROM "SystemSetting" WHERE id = 1), 10))::numeric / 100, 2)::double precision
WHERE payment.status = 'PAID';