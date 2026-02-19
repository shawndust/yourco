/*
  Warnings:

  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserInProcess` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Purchase";

-- DropTable
DROP TABLE "UserInProcess";

-- CreateIndex
CREATE INDEX "Item_price_idx" ON "Item"("price");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");
