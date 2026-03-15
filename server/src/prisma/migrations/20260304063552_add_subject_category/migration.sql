/*
  Warnings:

  - Made the column `rollNo` on table `Student` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "departmentId" INTEGER,
    "academicYearId" INTEGER NOT NULL,
    CONSTRAINT "Section_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Section_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallColumn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hallId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "benches" INTEGER NOT NULL,
    CONSTRAINT "HallColumn_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HallBench" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "columnId" INTEGER NOT NULL,
    "benchNumber" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    CONSTRAINT "HallBench_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "HallColumn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examName" TEXT NOT NULL,
    "examDate" DATETIME NOT NULL,
    "session" TEXT NOT NULL,
    "examMode" TEXT NOT NULL DEFAULT 'CIA',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSession_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExamSession" ("createdAt", "createdBy", "examDate", "examName", "id", "isLocked", "session", "updatedAt") SELECT "createdAt", "createdBy", "examDate", "examName", "id", "isLocked", "session", "updatedAt" FROM "ExamSession";
DROP TABLE "ExamSession";
ALTER TABLE "new_ExamSession" RENAME TO "ExamSession";
CREATE TABLE "new_ExternalMark" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subjectId" INTEGER NOT NULL,
    "dummyNumber" TEXT NOT NULL,
    "rawExternal100" REAL NOT NULL,
    "convertedExternal60" REAL NOT NULL,
    "submittedBy" INTEGER NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ExternalMark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalMark_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ExternalMark" ("convertedExternal60", "dummyNumber", "id", "locked", "rawExternal100", "subjectId", "submittedAt", "submittedBy") SELECT "convertedExternal60", "dummyNumber", "id", "locked", "rawExternal100", "subjectId", "submittedAt", "submittedBy" FROM "ExternalMark";
DROP TABLE "ExternalMark";
ALTER TABLE "new_ExternalMark" RENAME TO "ExternalMark";
CREATE UNIQUE INDEX "ExternalMark_dummyNumber_key" ON "ExternalMark"("dummyNumber");
CREATE INDEX "ExternalMark_dummyNumber_idx" ON "ExternalMark"("dummyNumber");
CREATE INDEX "ExternalMark_subjectId_idx" ON "ExternalMark"("subjectId");
CREATE TABLE "new_FacultyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facultyId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "department" TEXT,
    CONSTRAINT "FacultyAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FacultyAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_FacultyAssignment" ("facultyId", "id", "section", "subjectId") SELECT "facultyId", "id", "section", "subjectId" FROM "FacultyAssignment";
DROP TABLE "FacultyAssignment";
ALTER TABLE "new_FacultyAssignment" RENAME TO "FacultyAssignment";
CREATE TABLE "new_Hall" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hallName" TEXT NOT NULL,
    "blockName" TEXT NOT NULL,
    "totalRows" INTEGER,
    "benchesPerRow" INTEGER,
    "totalBenches" INTEGER NOT NULL DEFAULT 0,
    "capacityCIA" INTEGER NOT NULL DEFAULT 0,
    "capacityEND" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Hall" ("benchesPerRow", "blockName", "capacity", "createdAt", "hallName", "id", "isActive", "totalRows", "updatedAt") SELECT "benchesPerRow", "blockName", "capacity", "createdAt", "hallName", "id", "isActive", "totalRows", "updatedAt" FROM "Hall";
DROP TABLE "Hall";
ALTER TABLE "new_Hall" RENAME TO "Hall";
CREATE TABLE "new_HallAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examSessionId" INTEGER NOT NULL,
    "hallId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "department" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "rowNumber" INTEGER,
    "columnNumber" INTEGER,
    "benchIndex" INTEGER,
    "columnLabel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HallAllocation_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HallAllocation_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HallAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HallAllocation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HallAllocation" ("columnNumber", "createdAt", "department", "examSessionId", "hallId", "id", "rowNumber", "seatNumber", "studentId", "subjectId", "year") SELECT "columnNumber", "createdAt", "department", "examSessionId", "hallId", "id", "rowNumber", "seatNumber", "studentId", "subjectId", "year" FROM "HallAllocation";
DROP TABLE "HallAllocation";
ALTER TABLE "new_HallAllocation" RENAME TO "HallAllocation";
CREATE UNIQUE INDEX "HallAllocation_examSessionId_studentId_key" ON "HallAllocation"("examSessionId", "studentId");
CREATE UNIQUE INDEX "HallAllocation_examSessionId_hallId_seatNumber_key" ON "HallAllocation"("examSessionId", "hallId", "seatNumber");
CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rollNo" TEXT NOT NULL,
    "registerNumber" TEXT,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "year" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "regulation" TEXT DEFAULT '2021',
    "batch" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" INTEGER,
    "sectionId" INTEGER,
    "currentSemester" INTEGER,
    "academicYearId" INTEGER,
    "batchYear" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("createdAt", "department", "id", "name", "registerNumber", "rollNo", "section", "semester", "year") SELECT "createdAt", "department", "id", "name", "registerNumber", "rollNo", "section", "semester", "year" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_rollNo_key" ON "Student"("rollNo");
CREATE UNIQUE INDEX "Student_registerNumber_key" ON "Student"("registerNumber");
CREATE INDEX "Student_department_year_section_semester_idx" ON "Student"("department", "year", "section", "semester");
CREATE INDEX "Student_departmentId_currentSemester_idx" ON "Student"("departmentId", "currentSemester");
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");
CREATE TABLE "new_Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "department" TEXT,
    "semester" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "type" TEXT NOT NULL DEFAULT 'DEPARTMENT',
    "subjectCategory" TEXT NOT NULL DEFAULT 'THEORY',
    "theoryCredit" INTEGER,
    "labCredit" INTEGER,
    "hasRelativeGrade" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Subject" ("code", "credits", "department", "id", "name", "semester", "shortName", "type") SELECT "code", "credits", "department", "id", "name", "semester", "shortName", "type" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
CREATE TABLE "new_SubjectDummyMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "originalRegisterNo" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "subjectCode" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "dummyNumber" TEXT,
    "answerScriptNo" TEXT,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "boardCode" TEXT,
    "qpCode" TEXT,
    "marks" REAL,
    "mappingLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectDummyMapping_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SubjectDummyMapping_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SubjectDummyMapping" ("academicYear", "createdAt", "department", "dummyNumber", "id", "mappingLocked", "originalRegisterNo", "section", "semester", "studentId", "subjectCode", "subjectId") SELECT "academicYear", "createdAt", "department", "dummyNumber", "id", "mappingLocked", "originalRegisterNo", "section", "semester", "studentId", "subjectCode", "subjectId" FROM "SubjectDummyMapping";
DROP TABLE "SubjectDummyMapping";
ALTER TABLE "new_SubjectDummyMapping" RENAME TO "SubjectDummyMapping";
CREATE INDEX "SubjectDummyMapping_dummyNumber_idx" ON "SubjectDummyMapping"("dummyNumber");
CREATE INDEX "SubjectDummyMapping_studentId_idx" ON "SubjectDummyMapping"("studentId");
CREATE INDEX "SubjectDummyMapping_subjectId_idx" ON "SubjectDummyMapping"("subjectId");
CREATE UNIQUE INDEX "SubjectDummyMapping_studentId_subjectId_key" ON "SubjectDummyMapping"("studentId", "subjectId");
CREATE UNIQUE INDEX "SubjectDummyMapping_subjectId_dummyNumber_key" ON "SubjectDummyMapping"("subjectId", "dummyNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Section_semester_type_idx" ON "Section"("semester", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_semester_departmentId_academicYearId_key" ON "Section"("name", "semester", "departmentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "HallBench_columnId_benchNumber_key" ON "HallBench"("columnId", "benchNumber");

-- CreateIndex
CREATE INDEX "Marks_isApproved_isLocked_idx" ON "Marks"("isApproved", "isLocked");
