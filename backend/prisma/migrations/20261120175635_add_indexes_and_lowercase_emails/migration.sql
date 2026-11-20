-- CreateIndex
CREATE INDEX "Board_ownerId_idx" ON "Board"("ownerId");

-- CreateIndex
CREATE INDEX "BoardMember_userId_idx" ON "BoardMember"("userId");

-- CreateIndex
CREATE INDEX "BoardVersion_boardId_createdAt_idx" ON "BoardVersion"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_shapeId_idx" ON "Comment"("shapeId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Shape_boardId_idx" ON "Shape"("boardId");

-- Emails are matched in lower case from now on. Existing rows are lower-cased, except any that would collide with another account.
UPDATE "User" u SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (SELECT 1 FROM "User" o WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email"));
