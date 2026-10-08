ALTER TABLE "Guesthouse"
ADD COLUMN "videoUrl" TEXT,
ADD COLUMN "videoPublicId" TEXT;

CREATE TABLE "RoomImage" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomImage_roomId_idx" ON "RoomImage"("roomId");

ALTER TABLE "RoomImage"
ADD CONSTRAINT "RoomImage_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
