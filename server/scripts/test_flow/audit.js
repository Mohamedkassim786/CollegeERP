const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Audit ---');
  const counts = {
    Students: await prisma.student.count(),
    Subjects: await prisma.subject.count(),
    Faculty: await prisma.faculty.count(),
    Attendance: await prisma.studentAttendance.count(),
    Marks: await prisma.marks.count(),
    EndSemMarks: await prisma.endSemMarks.count(),
    Results: await prisma.semesterResult.count(),
    HallAllocations: await prisma.hallAllocation.count(),
    DummyMappings: await prisma.subjectDummyMapping.count(),
    ExternalMarks: await prisma.externalMark.count(),
    Eligibility: await prisma.attendanceEligibility.count(),
    Sessions: await prisma.examSession.count()
  };
  console.table(counts);

  // Check specific student (MECH Student 5) for detention
  const s5 = await prisma.student.findFirst({ where: { rollNo: '23MECH005' } });
  if (s5) {
    const el = await prisma.attendanceEligibility.findFirst({ where: { studentId: s5.id } });
    console.log(`Student 23MECH005 Eligibility: ${el?.status} (${el?.attendancePercent?.toFixed(2)}%)`);
  }

  console.log('--- Audit Complete ---');
}

main().finally(() => prisma.$disconnect());
