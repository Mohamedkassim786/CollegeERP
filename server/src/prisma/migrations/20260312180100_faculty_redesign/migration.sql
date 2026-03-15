/*
  Warnings:

  - You are about to drop the column `dateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFirstLogin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isHOD` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Faculty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staffId" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'password123',
    "fullName" TEXT NOT NULL,
    "department" TEXT,
    "role" TEXT NOT NULL DEFAULT 'FACULTY',
    "photo" TEXT,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "bloodGroup" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "designation" TEXT,
    "qualification" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FacultyAbsence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facultyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacultyAbsence_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacultyAbsence" ("createdAt", "date", "facultyId", "id", "period", "reason") SELECT "createdAt", "date", "facultyId", "id", "period", "reason" FROM "FacultyAbsence";
DROP TABLE "FacultyAbsence";
ALTER TABLE "new_FacultyAbsence" RENAME TO "FacultyAbsence";
CREATE UNIQUE INDEX "FacultyAbsence_facultyId_date_period_key" ON "FacultyAbsence"("facultyId", "date", "period");
CREATE TABLE "new_FacultyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facultyId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "department" TEXT,
    CONSTRAINT "FacultyAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacultyAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacultyAssignment" ("department", "facultyId", "id", "section", "subjectId") SELECT "department", "facultyId", "id", "section", "subjectId" FROM "FacultyAssignment";
DROP TABLE "FacultyAssignment";
ALTER TABLE "new_FacultyAssignment" RENAME TO "FacultyAssignment";
CREATE TABLE "new_Material" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "subjectId" INTEGER NOT NULL,
    "instructorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Material_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Material" ("createdAt", "description", "fileUrl", "id", "instructorId", "subjectId", "title", "updatedAt") SELECT "createdAt", "description", "fileUrl", "id", "instructorId", "subjectId", "title", "updatedAt" FROM "Material";
DROP TABLE "Material";
ALTER TABLE "new_Material" RENAME TO "Material";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hodId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'ATTENDANCE_MISSING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "Faculty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "facultyId", "hodId", "id", "isRead", "message", "type") SELECT "createdAt", "facultyId", "hodId", "id", "isRead", "message", "type" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_hodId_isRead_idx" ON "Notification"("hodId", "isRead");
CREATE TABLE "new_StudentAttendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "period" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentAttendance_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentAttendance" ("createdAt", "date", "facultyId", "id", "period", "status", "studentId", "subjectId") SELECT "createdAt", "date", "facultyId", "id", "period", "status", "studentId", "subjectId" FROM "StudentAttendance";
DROP TABLE "StudentAttendance";
ALTER TABLE "new_StudentAttendance" RENAME TO "StudentAttendance";
CREATE UNIQUE INDEX "StudentAttendance_studentId_subjectId_date_period_key" ON "StudentAttendance"("studentId", "subjectId", "date", "period");
CREATE TABLE "new_Substitution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timetableId" INTEGER NOT NULL,
    "substituteFacultyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Substitution_substituteFacultyId_fkey" FOREIGN KEY ("substituteFacultyId") REFERENCES "Faculty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Substitution_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Substitution" ("createdAt", "date", "id", "substituteFacultyId", "timetableId") SELECT "createdAt", "date", "id", "substituteFacultyId", "timetableId" FROM "Substitution";
DROP TABLE "Substitution";
ALTER TABLE "new_Substitution" RENAME TO "Substitution";
CREATE UNIQUE INDEX "Substitution_timetableId_date_key" ON "Substitution"("timetableId", "date");
CREATE TABLE "new_Timetable" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "department" TEXT,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "period" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT,
    "subjectName" TEXT,
    "facultyName" TEXT,
    "room" TEXT,
    "subjectId" INTEGER,
    "facultyId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timetable_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Timetable" ("day", "department", "duration", "facultyId", "facultyName", "id", "period", "room", "section", "semester", "subjectId", "subjectName", "type", "updatedAt", "year") SELECT "day", "department", "duration", "facultyId", "facultyName", "id", "period", "room", "section", "semester", "subjectId", "subjectName", "type", "updatedAt", "year" FROM "Timetable";
DROP TABLE "Timetable";
ALTER TABLE "new_Timetable" RENAME TO "Timetable";
CREATE UNIQUE INDEX "Timetable_department_year_semester_section_day_period_key" ON "Timetable"("department", "year", "semester", "section", "day", "period");
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "department", "designation", "email", "forcePasswordChange", "fullName", "id", "isDisabled", "lastLogin", "lastPasswordChange", "password", "phoneNumber", "role", "username") SELECT "createdAt", "department", "designation", "email", "forcePasswordChange", "fullName", "id", "isDisabled", "lastLogin", "lastPasswordChange", "password", "phoneNumber", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_staffId_key" ON "Faculty"("staffId");
