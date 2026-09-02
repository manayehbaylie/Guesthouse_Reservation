-- Align Notification table with the Prisma schema used by the app.
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "guesthouseId" INTEGER;

CREATE INDEX IF NOT EXISTS "Notification_guesthouseId_idx"
  ON "Notification"("guesthouseId");

CREATE INDEX IF NOT EXISTS "Notification_category_idx"
  ON "Notification"("category");

CREATE INDEX IF NOT EXISTS "Notification_type_idx"
  ON "Notification"("type");

ALTER TABLE "Notification"
  ADD CONSTRAINT IF NOT EXISTS "Notification_guesthouseId_fkey"
  FOREIGN KEY ("guesthouseId") REFERENCES "Guesthouse"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
