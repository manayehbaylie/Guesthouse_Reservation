ALTER TABLE "SystemSetting"
ADD COLUMN "systemLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "systemLockMessage" TEXT NOT NULL DEFAULT 'Under maintenance, please come back later';