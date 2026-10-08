ALTER TABLE "User" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramLinkExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");
CREATE UNIQUE INDEX "User_telegramLinkCodeHash_key" ON "User"("telegramLinkCodeHash");
