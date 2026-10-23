ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "chapaTxRef" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_chapaTxRef_key" ON "Payment"("chapaTxRef");