CREATE TABLE "telegram_accounts" (
    "telegram_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "telegram_accounts_pkey" PRIMARY KEY ("telegram_id")
);

CREATE UNIQUE INDEX "telegram_accounts_user_id_key" ON "telegram_accounts"("user_id");

INSERT INTO "telegram_accounts" ("telegram_id", "user_id", "updated_at")
SELECT "telegramChatId", "id", CURRENT_TIMESTAMP
FROM "User"
WHERE "telegramChatId" IS NOT NULL
ON CONFLICT ("telegram_id") DO NOTHING;

ALTER TABLE "telegram_accounts"
ADD CONSTRAINT "telegram_accounts_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment" ADD COLUMN "telegram_notified_at" TIMESTAMP(3);