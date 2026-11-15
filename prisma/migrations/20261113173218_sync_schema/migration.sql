/*
  Warnings:

  - You are about to drop the column `telebirrRef` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `txRef` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ViewingSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposedAt" DATETIME NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "listingId" TEXT NOT NULL,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    CONSTRAINT "ViewingSchedule_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewingSchedule_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ViewingSchedule_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
INSERT INTO "new_Listing" ("city", "createdAt", "depositBirr", "description", "furnished", "id", "latitude", "longitude", "neighborhood", "postedById", "priceBirr", "roomType", "title") SELECT "city", "createdAt", "depositBirr", "description", "furnished", "id", "latitude", "longitude", "neighborhood", "postedById", "priceBirr", "roomType", "title" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_city_neighborhood_idx" ON "Listing"("city", "neighborhood");
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
CREATE INDEX "Listing_propertyType_bedrooms_idx" ON "Listing"("propertyType", "bedrooms");
CREATE INDEX "Listing_availableFrom_idx" ON "Listing"("availableFrom");
CREATE INDEX "Listing_published_idx" ON "Listing"("published");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountBirr" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL DEFAULT 'LISTING_FEE',
    "txRef" TEXT NOT NULL,
    "chapaReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "profileId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "Payment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amountBirr", "completedAt", "createdAt", "id", "listingId", "profileId", "status") SELECT "amountBirr", "completedAt", "createdAt", "id", "listingId", "profileId", "status" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_txRef_key" ON "Payment"("txRef");
CREATE INDEX "Payment_profileId_createdAt_idx" ON "Payment"("profileId", "createdAt");
CREATE INDEX "Payment_listingId_idx" ON "Payment"("listingId");
CREATE INDEX "Payment_txRef_idx" ON "Payment"("txRef");
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TENANT',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "gender" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "livesInProperty" BOOLEAN,
    "smokingOk" BOOLEAN,
    "petsOk" BOOLEAN,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Profile" ("createdAt", "email", "id", "name", "phone", "role", "verified") SELECT "createdAt", "email", "id", "name", "phone", "role", "verified" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_phone_key" ON "Profile"("phone");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ViewingSchedule_listingId_proposedAt_idx" ON "ViewingSchedule"("listingId", "proposedAt");

-- CreateIndex
CREATE INDEX "ViewingSchedule_toProfileId_status_idx" ON "ViewingSchedule"("toProfileId", "status");

-- CreateIndex
CREATE INDEX "OtpChallenge_target_createdAt_idx" ON "OtpChallenge"("target", "createdAt");
