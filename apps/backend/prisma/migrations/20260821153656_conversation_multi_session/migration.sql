-- DropIndex
DROP INDEX "Conversation_sessionId_key";

-- CreateIndex
CREATE INDEX "Conversation_sessionId_idx" ON "Conversation"("sessionId");
