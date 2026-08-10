/*
  Warnings:

  - You are about to drop the column `approved` on the `Guesthouse` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GuesthouseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Guesthouse" DROP COLUMN "approved",
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "GuesthouseStatus" NOT NULL DEFAULT 'PENDING';
