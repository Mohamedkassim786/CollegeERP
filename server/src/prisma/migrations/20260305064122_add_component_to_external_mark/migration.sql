-- AlterTable
ALTER TABLE "Marks" ADD COLUMN "lab_assessment" REAL;
ALTER TABLE "Marks" ADD COLUMN "lab_attendance" REAL;
ALTER TABLE "Marks" ADD COLUMN "lab_model" REAL;
ALTER TABLE "Marks" ADD COLUMN "lab_observation" REAL;
ALTER TABLE "Marks" ADD COLUMN "lab_record" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExternalMark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subjectId" INTEGER NOT NULL,
    "dummyNumber" TEXT NOT NULL,
    "component" TEXT NOT NULL DEFAULT 'THEORY',
    "rawExternal100" REAL NOT NULL,
    "convertedExternal60" REAL NOT NULL,
    "submittedBy" INTEGER NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ExternalMark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalMark_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExternalMark" ("convertedExternal60", "dummyNumber", "id", "isApproved", "locked", "rawExternal100", "subjectId", "submittedAt", "submittedBy") SELECT "convertedExternal60", "dummyNumber", "id", "isApproved", "locked", "rawExternal100", "subjectId", "submittedAt", "submittedBy" FROM "ExternalMark";
DROP TABLE "ExternalMark";
ALTER TABLE "new_ExternalMark" RENAME TO "ExternalMark";
CREATE INDEX "ExternalMark_dummyNumber_idx" ON "ExternalMark"("dummyNumber");
CREATE INDEX "ExternalMark_subjectId_idx" ON "ExternalMark"("subjectId");
CREATE UNIQUE INDEX "ExternalMark_subjectId_dummyNumber_component_key" ON "ExternalMark"("subjectId", "dummyNumber", "component");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
