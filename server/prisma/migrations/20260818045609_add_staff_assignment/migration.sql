/*
  Warnings:

  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `price` on the `Room` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.

*/


-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Room"
ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "StaffAssignment" (
    "id" SERIAL NOT NULL,
    "guesthouseId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "guestId" INTEGER NOT NULL,
    "guesthouseId" INTEGER NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "ownerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAssignment_guesthouseId_idx" ON "StaffAssignment"("guesthouseId");

-- CreateIndex
CREATE INDEX "StaffAssignment_staffId_idx" ON "StaffAssignment"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAssignment_guesthouseId_staffId_key" ON "StaffAssignment"("guesthouseId", "staffId");

-- CreateIndex
CREATE INDEX "Review_guestId_idx" ON "Review"("guestId");

-- CreateIndex
CREATE INDEX "Review_guesthouseId_idx" ON "Review"("guesthouseId");

-- CreateIndex
CREATE INDEX "Review_reservationId_idx" ON "Review"("reservationId");

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_guesthouseId_fkey" FOREIGN KEY ("guesthouseId") REFERENCES "Guesthouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment" ADD CONSTRAINT "StaffAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_guesthouseId_fkey" FOREIGN KEY ("guesthouseId") REFERENCES "Guesthouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
