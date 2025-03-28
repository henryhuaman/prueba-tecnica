-- CreateTable
CREATE TABLE "BlackList" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlackList_pkey" PRIMARY KEY ("id")
);
