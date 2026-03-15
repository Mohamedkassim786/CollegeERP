-- CreateTable
CREATE TABLE "EndSemMarks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marksId" INTEGER NOT NULL,
    "externalMarks" REAL,
    "totalMarks" REAL,
    "grade" TEXT,
    "resultStatus" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EndSemMarks_marksId_fkey" FOREIGN KEY ("marksId") REFERENCES "Marks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GradeSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regulation" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minPercentage" REAL NOT NULL,
    "maxPercentage" REAL NOT NULL,
    "gradePoint" INTEGER NOT NULL,
    "resultStatus" TEXT NOT NULL DEFAULT 'PASS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SemesterControl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "department" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "markEntryOpen" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "actionLogs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SemesterResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "gpa" REAL NOT NULL,
    "cgpa" REAL NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "earnedCredits" INTEGER NOT NULL,
    "resultStatus" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SemesterResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Arrear" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "isCleared" BOOLEAN NOT NULL DEFAULT false,
    "clearedInSem" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Arrear_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Arrear_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArrearAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "arrearId" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "internalMarks" REAL,
    "externalMarks" REAL,
    "totalMarks" REAL,
    "grade" TEXT,
    "resultStatus" TEXT,
    "examDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArrearAttempt_arrearId_fkey" FOREIGN KEY ("arrearId") REFERENCES "Arrear" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalStaffTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staffId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "questionPaperUrl" TEXT,
    "remarks" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExternalStaffTask_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExternalStaffTask_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subject" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "department" TEXT,
    "semester" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "type" TEXT NOT NULL DEFAULT 'DEPARTMENT'
);
INSERT INTO "new_Subject" ("code", "department", "id", "name", "semester", "shortName", "type") SELECT "code", "department", "id", "name", "semester", "shortName", "type" FROM "Subject";
DROP TABLE "Subject";
ALTER TABLE "new_Subject" RENAME TO "Subject";
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "EndSemMarks_marksId_key" ON "EndSemMarks"("marksId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeSettings_regulation_grade_key" ON "GradeSettings"("regulation", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterControl_department_year_semester_section_key" ON "SemesterControl"("department", "year", "semester", "section");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterResult_studentId_semester_key" ON "SemesterResult"("studentId", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Arrear_studentId_subjectId_key" ON "Arrear"("studentId", "subjectId");
