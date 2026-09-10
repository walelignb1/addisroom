-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amountBirr" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "telebirrRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "profileId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    CONSTRAINT "Payment_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Payment_profileId_createdAt_idx" ON "Payment"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_listingId_idx" ON "Payment"("listingId");
