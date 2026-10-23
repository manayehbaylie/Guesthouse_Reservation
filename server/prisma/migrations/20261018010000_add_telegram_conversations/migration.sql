CREATE TABLE "telegram_conversations" (
    "chat_id" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "telegram_conversations_pkey" PRIMARY KEY ("chat_id")
);

CREATE INDEX "telegram_conversations_expires_at_idx" ON "telegram_conversations"("expires_at");