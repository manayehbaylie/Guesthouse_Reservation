-- AlterTable
ALTER TABLE "Guesthouse" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "category" SET DEFAULT 'general';

