ALTER TABLE "User" ADD COLUMN "normalizedEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "normalizedPhone" TEXT;
CREATE INDEX "login_attempts_identifier_ipAddress_success_createdAt_idx" ON "login_attempts"("identifier", "ipAddress", "success", "createdAt");

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN LOWER(SPLIT_PART(email, '@', 2)) IN ('gmail.com', 'googlemail.com') THEN
        CONCAT(REPLACE(SPLIT_PART(SPLIT_PART(LOWER(email), '@', 1), '+', 1), '.', ''), '@gmail.com')
      ELSE LOWER(email)
    END AS canonical_email
  FROM "User"
  WHERE email IS NOT NULL
), ranked AS (
  SELECT id, canonical_email,
    ROW_NUMBER() OVER (PARTITION BY canonical_email ORDER BY id) AS duplicate_rank
  FROM normalized
)
UPDATE "User" AS users
SET "normalizedEmail" = ranked.canonical_email
FROM ranked
WHERE users.id = ranked.id AND ranked.duplicate_rank = 1;

CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

WITH normalized AS (
  SELECT
    id,
    CASE
      WHEN REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') ~ '^09[0-9]{8}$' THEN
        CONCAT('+251', SUBSTRING(REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') FROM 2))
      WHEN REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') ~ '^9[0-9]{8}$' THEN
        CONCAT('+251', REGEXP_REPLACE(phone, '[^0-9+]', '', 'g'))
      WHEN REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') ~ '^2519[0-9]{8}$' THEN
        CONCAT('+', REGEXP_REPLACE(phone, '[^0-9+]', '', 'g'))
      WHEN REGEXP_REPLACE(phone, '[^0-9+]', '', 'g') ~ '^\+2519[0-9]{8}$' THEN
        REGEXP_REPLACE(phone, '[^0-9+]', '', 'g')
      ELSE NULL
    END AS canonical_phone
  FROM "User"
), ranked AS (
  SELECT id, canonical_phone,
    ROW_NUMBER() OVER (PARTITION BY canonical_phone ORDER BY id) AS duplicate_rank
  FROM normalized
  WHERE canonical_phone IS NOT NULL
)
UPDATE "User" AS users
SET "normalizedPhone" = ranked.canonical_phone
FROM ranked
WHERE users.id = ranked.id AND ranked.duplicate_rank = 1;

CREATE UNIQUE INDEX "User_normalizedPhone_key" ON "User"("normalizedPhone");

CREATE TABLE "refresh_tokens" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "accessTokenId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_revokedAt_expiresAt_idx" ON "refresh_tokens"("userId", "revokedAt", "expiresAt");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "password_reset_codes" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "resendAvailableAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "resetTokenHash" TEXT,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "password_reset_codes_challengeId_key" ON "password_reset_codes"("challengeId");
CREATE UNIQUE INDEX "password_reset_codes_resetTokenHash_key" ON "password_reset_codes"("resetTokenHash");
CREATE INDEX "password_reset_codes_userId_consumedAt_expiresAt_idx" ON "password_reset_codes"("userId", "consumedAt", "expiresAt");
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;