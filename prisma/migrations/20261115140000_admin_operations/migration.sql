-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "archivedAt" DATETIME;

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "activeSlot" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" DATETIME,
    "brokerVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" DATETIME,
    "phoneVerifiedAt" DATETIME,
    "identityStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "address" TEXT,
    "city" TEXT,
    "subCity" TEXT,
    "woreda" TEXT,
    "idType" TEXT,
    "idLastFour" TEXT,
    "identitySubmittedAt" DATETIME,
    "identityReviewedAt" DATETIME,
    "identityReviewNote" TEXT
);
INSERT INTO "new_Profile" ("address", "age", "bio", "city", "createdAt", "email", "emailVerifiedAt", "gender", "id", "idLastFour", "idType", "identityReviewNote", "identityReviewedAt", "identityStatus", "identitySubmittedAt", "isAdmin", "livesInProperty", "name", "passwordHash", "petsOk", "phone", "phoneVerifiedAt", "photoUrl", "profileComplete", "role", "smokingOk", "subCity", "verified", "woreda") SELECT "address", "age", "bio", "city", "createdAt", "email", "emailVerifiedAt", "gender", "id", "idLastFour", "idType", "identityReviewNote", "identityReviewedAt", "identityStatus", "identitySubmittedAt", "isAdmin", "livesInProperty", "name", "passwordHash", "petsOk", "phone", "phoneVerifiedAt", "photoUrl", "profileComplete", "role", "smokingOk", "subCity", "verified", "woreda" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_phone_key" ON "Profile"("phone");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Sponsorship_activeSlot_key" ON "Sponsorship"("activeSlot");


-- Existing operator-provisioned admins become super admins; web grants remain regular admins.
UPDATE "Profile" SET "isSuperAdmin" = true WHERE "isAdmin" = true;
