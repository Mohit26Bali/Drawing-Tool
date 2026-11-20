-- CreateTable
CREATE TABLE "BoardVersion" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "label" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardVersion" ADD CONSTRAINT "BoardVersion_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardVersion" ADD CONSTRAINT "BoardVersion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
