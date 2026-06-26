CREATE TABLE "condominiums" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "neighborhood" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zipCode" TEXT,
  "developer" TEXT,
  "builder" TEXT,
  "description" TEXT NOT NULL,
  "leisureInfrastructure" TEXT,
  "securityInfrastructure" TEXT,
  "servicesInfrastructure" TEXT,
  "condominiumValue" DECIMAL(14,2),
  "constructionRules" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "condominiums_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "condominium_images" (
  "id" TEXT NOT NULL,
  "condominiumId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "condominium_images_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "terrains" ADD COLUMN "condominiumId" TEXT;

CREATE UNIQUE INDEX "condominiums_slug_key" ON "condominiums"("slug");
CREATE INDEX "condominiums_city_state_idx" ON "condominiums"("city", "state");
CREATE INDEX "condominiums_neighborhood_idx" ON "condominiums"("neighborhood");
CREATE INDEX "condominiums_isActive_idx" ON "condominiums"("isActive");
CREATE INDEX "condominiums_deletedAt_idx" ON "condominiums"("deletedAt");
CREATE INDEX "condominium_images_condominiumId_idx" ON "condominium_images"("condominiumId");
CREATE INDEX "condominium_images_deletedAt_idx" ON "condominium_images"("deletedAt");
CREATE INDEX "terrains_condominiumId_idx" ON "terrains"("condominiumId");

ALTER TABLE "condominium_images"
  ADD CONSTRAINT "condominium_images_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "condominiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "terrains"
  ADD CONSTRAINT "terrains_condominiumId_fkey"
  FOREIGN KEY ("condominiumId") REFERENCES "condominiums"("id") ON DELETE SET NULL ON UPDATE CASCADE;
