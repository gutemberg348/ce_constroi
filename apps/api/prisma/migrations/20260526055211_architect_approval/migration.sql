-- CreateEnum
CREATE TYPE "ArchitectStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "architects" ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "status" "ArchitectStatus" NOT NULL DEFAULT 'PENDING_REVIEW';

-- CreateIndex
CREATE INDEX "architects_status_idx" ON "architects"("status");
