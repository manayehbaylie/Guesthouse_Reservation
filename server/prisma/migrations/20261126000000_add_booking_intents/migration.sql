CREATE TABLE "BookingIntent" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER,
    "roomId" INTEGER NOT NULL,
    "guesthouseId" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "reservationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingIntent_tokenHash_key" ON "BookingIntent"("tokenHash");
CREATE UNIQUE INDEX "BookingIntent_reservationId_key" ON "BookingIntent"("reservationId");
CREATE INDEX "BookingIntent_userId_expiresAt_idx" ON "BookingIntent"("userId", "expiresAt");
CREATE INDEX "BookingIntent_expiresAt_idx" ON "BookingIntent"("expiresAt");

ALTER TABLE "BookingIntent" ADD CONSTRAINT "BookingIntent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingIntent" ADD CONSTRAINT "BookingIntent_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingIntent" ADD CONSTRAINT "BookingIntent_reservationId_fkey"
FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;