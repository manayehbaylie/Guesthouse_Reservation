ALTER TABLE "SystemSetting"
ADD COLUMN IF NOT EXISTS "systemLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "systemLockMessage" TEXT NOT NULL DEFAULT 'Under maintenance, please come back later';
