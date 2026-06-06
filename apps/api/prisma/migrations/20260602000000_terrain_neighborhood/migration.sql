-- AlterTable
ALTER TABLE "terrains" ADD COLUMN "neighborhood" TEXT;

-- CreateIndex
CREATE INDEX "terrains_neighborhood_idx" ON "terrains"("neighborhood");
