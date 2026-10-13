CREATE TABLE IF NOT EXISTS "system_lock" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "is_locked" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT NOT NULL DEFAULT 'Under maintenance, please come back later',
  "locked_by" INTEGER,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_lock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "system_lock_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "system_lock_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "system_lock" ("id", "is_locked", "message", "updated_at")
SELECT 1, "systemLocked", "systemLockMessage", "updatedAt"
FROM "SystemSetting"
WHERE "id" = 1
ON CONFLICT ("id") DO NOTHING;
