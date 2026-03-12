-- AlterTable
ALTER TABLE "Student" ADD COLUMN "address" TEXT;
ALTER TABLE "Student" ADD COLUMN "admissionYear" TEXT;
ALTER TABLE "Student" ADD COLUMN "bloodGroup" TEXT;
ALTER TABLE "Student" ADD COLUMN "city" TEXT;
ALTER TABLE "Student" ADD COLUMN "dateOfBirth" TEXT;
ALTER TABLE "Student" ADD COLUMN "district" TEXT;
ALTER TABLE "Student" ADD COLUMN "email" TEXT;
ALTER TABLE "Student" ADD COLUMN "fatherName" TEXT;
ALTER TABLE "Student" ADD COLUMN "fatherPhone" TEXT;
ALTER TABLE "Student" ADD COLUMN "gender" TEXT;
ALTER TABLE "Student" ADD COLUMN "guardianName" TEXT;
ALTER TABLE "Student" ADD COLUMN "guardianPhone" TEXT;
ALTER TABLE "Student" ADD COLUMN "motherName" TEXT;
ALTER TABLE "Student" ADD COLUMN "motherPhone" TEXT;
ALTER TABLE "Student" ADD COLUMN "nationality" TEXT;
ALTER TABLE "Student" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "Student" ADD COLUMN "photo" TEXT;
ALTER TABLE "Student" ADD COLUMN "pincode" TEXT;
ALTER TABLE "Student" ADD COLUMN "state" TEXT;

-- CreateTable
CREATE TABLE "MarkAuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "oldValue" REAL,
    "newValue" REAL,
    "changedBy" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttendanceEligibility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "attendancePercent" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "isException" BOOLEAN NOT NULL DEFAULT false,
    "exceptionReason" TEXT,
    "exceptionGrantedBy" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceEligibility_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceEligibility_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hodId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'ATTENDANCE_MISSING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExternalMarkAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staffId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "component" TEXT NOT NULL DEFAULT 'THEORY',
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExternalMarkAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalMarkAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExternalMarkAssignment" ("createdAt", "deadline", "id", "staffId", "status", "subjectId", "updatedAt") SELECT "createdAt", "deadline", "id", "staffId", "status", "subjectId", "updatedAt" FROM "ExternalMarkAssignment";
DROP TABLE "ExternalMarkAssignment";
ALTER TABLE "new_ExternalMarkAssignment" RENAME TO "ExternalMarkAssignment";
CREATE UNIQUE INDEX "ExternalMarkAssignment_staffId_subjectId_component_key" ON "ExternalMarkAssignment"("staffId", "subjectId", "component");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "department" TEXT,
    "designation" TEXT,
    "lastPasswordChange" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "forcePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeeId" TEXT,
    "dateOfBirth" DATETIME,
    "photoUrl" TEXT,
    "isHOD" BOOLEAN NOT NULL DEFAULT false,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("createdAt", "department", "designation", "email", "forcePasswordChange", "fullName", "id", "isDisabled", "lastLogin", "lastPasswordChange", "password", "phoneNumber", "role", "username") SELECT "createdAt", "department", "designation", "email", "forcePasswordChange", "fullName", "id", "isDisabled", "lastLogin", "lastPasswordChange", "password", "phoneNumber", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AttendanceEligibility_semester_status_idx" ON "AttendanceEligibility"("semester", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceEligibility_studentId_subjectId_semester_key" ON "AttendanceEligibility"("studentId", "subjectId", "semester");

-- CreateIndex
CREATE INDEX "Notification_hodId_isRead_idx" ON "Notification"("hodId", "isRead");
