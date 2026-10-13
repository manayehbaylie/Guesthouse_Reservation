ALTER TABLE "audit_logs"
ADD COLUMN "eventCode" TEXT NOT NULL DEFAULT 'setting_changed',
ADD COLUMN "method" TEXT NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN "path" TEXT NOT NULL DEFAULT '/api/admin/settings',
ADD COLUMN "statusCode" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'INFO';

CREATE TABLE "active_sessions" (
    "id" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "device" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "active_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "active_sessions_tokenId_key" ON "active_sessions"("tokenId");
CREATE INDEX "active_sessions_userId_revokedAt_expiresAt_idx" ON "active_sessions"("userId", "revokedAt", "expiresAt");
CREATE INDEX "active_sessions_lastActivity_idx" ON "active_sessions"("lastActivity");
ALTER TABLE "active_sessions" ADD CONSTRAINT "active_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "blocked_ips" (
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "blockedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("ipAddress")
);

CREATE INDEX "blocked_ips_createdAt_idx" ON "blocked_ips"("createdAt");
ALTER TABLE "blocked_ips" ADD CONSTRAINT "blocked_ips_blockedBy_fkey"
FOREIGN KEY ("blockedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;