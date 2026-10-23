ALTER TYPE "PaymentStatus" ADD VALUE 'REFUND_REQUIRED';

CREATE TYPE "BookingDraftStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'EXPIRED',
  'FAILED',
  'REFUND_REQUIRED'
);

ALTER TABLE "Payment"
  ALTER COLUMN "reservationId" DROP NOT NULL,
  ADD COLUMN "bookingDraftId" INTEGER;

CREATE TABLE "booking_drafts" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "roomId" INTEGER NOT NULL,
  "checkIn" TIMESTAMP(3) NOT NULL,
  "checkOut" TIMESTAMP(3) NOT NULL,
  "guests" INTEGER NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "txRef" TEXT NOT NULL,
  "method" "PaymentMethod",
  "status" "BookingDraftStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "booking_drafts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "booking_drafts_dates_check" CHECK ("checkOut" > "checkIn"),
  CONSTRAINT "booking_drafts_guests_check" CHECK ("guests" > 0),
  CONSTRAINT "booking_drafts_amount_check" CHECK ("amount" > 0)
);

CREATE UNIQUE INDEX "booking_drafts_txRef_key" ON "booking_drafts"("txRef");
CREATE INDEX "booking_drafts_userId_status_idx" ON "booking_drafts"("userId", "status");
CREATE INDEX "booking_drafts_roomId_checkIn_checkOut_idx" ON "booking_drafts"("roomId", "checkIn", "checkOut");
CREATE INDEX "booking_drafts_status_expiresAt_idx" ON "booking_drafts"("status", "expiresAt");
CREATE UNIQUE INDEX "Payment_bookingDraftId_key" ON "Payment"("bookingDraftId");
ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_bookingDraftId_fkey"
  FOREIGN KEY ("bookingDraftId") REFERENCES "booking_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Payment_reservation_or_draft_check"
  CHECK ("reservationId" IS NOT NULL OR "bookingDraftId" IS NOT NULL);

ALTER TABLE "booking_drafts"
  ADD CONSTRAINT "booking_drafts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "booking_drafts_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
