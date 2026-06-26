ALTER TABLE "terrains" ADD COLUMN "isFeaturedOnHome" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "terrains_isFeaturedOnHome_idx" ON "terrains"("isFeaturedOnHome");
