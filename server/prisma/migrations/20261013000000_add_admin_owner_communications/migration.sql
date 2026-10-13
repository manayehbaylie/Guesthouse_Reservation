CREATE TABLE "CommunicationMessage" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunicationMessage_senderId_recipientId_createdAt_idx"
ON "CommunicationMessage"("senderId", "recipientId", "createdAt");

CREATE INDEX "CommunicationMessage_recipientId_readAt_idx"
ON "CommunicationMessage"("recipientId", "readAt");

ALTER TABLE "CommunicationMessage"
ADD CONSTRAINT "CommunicationMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunicationMessage"
ADD CONSTRAINT "CommunicationMessage_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;