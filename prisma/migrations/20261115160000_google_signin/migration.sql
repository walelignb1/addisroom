-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "googleSubject" TEXT;

-- CreateTable
CREATE TABLE "OAuthLogin" (
    "stateHash" TEXT NOT NULL PRIMARY KEY,
    "nonce" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "next" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_googleSubject_key" ON "Profile"("googleSubject");

