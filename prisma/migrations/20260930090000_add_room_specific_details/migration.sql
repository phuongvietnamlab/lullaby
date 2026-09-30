ALTER TABLE "rooms"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "nameEn" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "descriptionEn" TEXT,
  ADD COLUMN "basePriceOverride" DECIMAL(10, 2),
  ADD COLUMN "maxGuestsOverride" INTEGER,
  ADD COLUMN "bedTypeOverride" TEXT,
  ADD COLUMN "sizeOverride" INTEGER,
  ADD COLUMN "images" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "amenities" JSONB NOT NULL DEFAULT '[]';
