-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Addis Ababa',
    "neighborhood" TEXT NOT NULL,
    "roadName" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "roomType" TEXT NOT NULL DEFAULT 'ROOM',
    "propertyType" TEXT NOT NULL DEFAULT 'APARTMENT',
    "dealType" TEXT NOT NULL DEFAULT 'RENT',
    "areaSqm" INTEGER,
    "floor" INTEGER,
    "bedrooms" TEXT NOT NULL DEFAULT 'ONE',
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "priceBirr" INTEGER NOT NULL,
    "depositBirr" INTEGER,
    "availableFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedById" TEXT NOT NULL,
    CONSTRAINT "Listing_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("availableFrom", "bedrooms", "city", "createdAt", "depositBirr", "description", "furnished", "id", "latitude", "longitude", "neighborhood", "postedById", "priceBirr", "propertyType", "published", "roadName", "roomType", "title") SELECT "availableFrom", "bedrooms", "city", "createdAt", "depositBirr", "description", "furnished", "id", "latitude", "longitude", "neighborhood", "postedById", "priceBirr", "propertyType", "published", "roadName", "roomType", "title" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_city_neighborhood_idx" ON "Listing"("city", "neighborhood");
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
CREATE INDEX "Listing_propertyType_bedrooms_idx" ON "Listing"("propertyType", "bedrooms");
CREATE INDEX "Listing_availableFrom_idx" ON "Listing"("availableFrom");
CREATE INDEX "Listing_published_idx" ON "Listing"("published");
CREATE INDEX "Listing_dealType_propertyType_idx" ON "Listing"("dealType", "propertyType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
