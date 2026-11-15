-- CreateTable
CREATE TABLE "Session" (
    "tokenHash" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IdentityDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "encryptedData" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdentityDocument_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" DATETIME NOT NULL
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
INSERT INTO "new_Profile" ("age", "bio", "createdAt", "email", "gender", "id", "livesInProperty", "name", "passwordHash", "petsOk", "phone", "photoUrl", "profileComplete", "role", "smokingOk", "verified") SELECT "age", "bio", "createdAt", "email", "gender", "id", "livesInProperty", "name", "passwordHash", "petsOk", "phone", "photoUrl", "profileComplete", "role", "smokingOk", "verified" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_phone_key" ON "Profile"("phone");
CREATE UNIQUE INDEX "Profile_email_key" ON "Profile"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Session_profileId_idx" ON "Session"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityDocument_profileId_kind_key" ON "IdentityDocument"("profileId", "kind");


-- Legacy contact verification and self-selected broker flags are not identity approval.
UPDATE "Profile" SET "verified" = false;
UPDATE "Profile" SET "phone" = NULL WHERE "phone" LIKE 'otp-%';
