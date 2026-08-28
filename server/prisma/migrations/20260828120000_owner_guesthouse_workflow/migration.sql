ALTER TABLE "User"
ADD COLUMN "residentialAddress" TEXT,
ADD COLUMN "idType" TEXT,
ADD COLUMN "idNumber" TEXT;

ALTER TYPE "GuesthouseStatus" RENAME TO "GuesthouseStatus_old";
CREATE TYPE "GuesthouseStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "Guesthouse"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "GuesthouseStatus"
USING "status"::text::"GuesthouseStatus";

DROP TYPE "GuesthouseStatus_old";

ALTER TABLE "Guesthouse"
ADD COLUMN "subCity" TEXT,
ADD COLUMN "woreda" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "numberOfRooms" INTEGER,
ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "licenseNumber" TEXT,
ADD COLUMN "licenseDocument" TEXT;

ALTER TABLE "Guesthouse"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';