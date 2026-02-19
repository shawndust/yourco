/*
  Warnings:

  - You are about to drop the `Credit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Credit";

-- CreateTable
CREATE TABLE "UserInProcess" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserInProcess_pkey" PRIMARY KEY ("id")
);
