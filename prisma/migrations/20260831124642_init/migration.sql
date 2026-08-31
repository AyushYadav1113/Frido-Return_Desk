-- CreateEnum
CREATE TYPE "Status" AS ENUM ('OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Reason" AS ENUM ('DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND');

-- CreateEnum
CREATE TYPE "Resolution" AS ENUM ('REFUND', 'REPLACEMENT', 'STORE_CREDIT');

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "orderNumber" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemSku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" "Reason" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'OPEN',
    "resolution" "Resolution",
    "refundAmount" DECIMAL(10,2),
    "removedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_reference_key" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE INDEX "ReturnRequest_status_idx" ON "ReturnRequest"("status");

-- CreateIndex
CREATE INDEX "ReturnRequest_reason_idx" ON "ReturnRequest"("reason");

-- CreateIndex
CREATE INDEX "ReturnRequest_orderNumber_idx" ON "ReturnRequest"("orderNumber");

-- CreateIndex
CREATE INDEX "ReturnRequest_customerEmail_idx" ON "ReturnRequest"("customerEmail");

-- CreateIndex
CREATE INDEX "ReturnRequest_reference_idx" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE INDEX "ReturnRequest_createdAt_idx" ON "ReturnRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Note_requestId_createdAt_idx" ON "Note"("requestId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
