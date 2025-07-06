/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `UserPlan` table. All the data in the column will be lost.
  - You are about to drop the column `maxAnalyses` on the `UserPlan` table. All the data in the column will be lost.
  - You are about to drop the column `maxFileSize` on the `UserPlan` table. All the data in the column will be lost.
  - Added the required column `planId` to the `UserPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "maxAnalyses" INTEGER NOT NULL,
    "maxFileSize" INTEGER NOT NULL,
    "maxVideoLength" INTEGER NOT NULL,
    "maxReports" INTEGER NOT NULL,
    "features" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userPlanId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT,
    "paymentProvider" TEXT,
    "externalId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "interval" TEXT NOT NULL DEFAULT 'MONTHLY',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "cancelledAt" DATETIME,
    "cancelReason" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isTrialUsed" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" DATETIME,
    "currentPeriodStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" DATETIME,
    "analysesUsed" INTEGER NOT NULL DEFAULT 0,
    "reportsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_UserPlan" ("createdAt", "id", "planType", "updatedAt", "userId") SELECT "createdAt", "id", "planType", "updatedAt", "userId" FROM "UserPlan";
DROP TABLE "UserPlan";
ALTER TABLE "new_UserPlan" RENAME TO "UserPlan";
CREATE UNIQUE INDEX "UserPlan_userId_key" ON "UserPlan"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
