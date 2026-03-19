const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Internal Marks and Eligibility ---');

  const students = await prisma.student.findMany();
  const subjects = await prisma.subject.findMany();
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  // 1. Generate Internal Marks
  for (const student of students) {
    const studentSubjects = subjects.filter(s => s.department === student.department && s.semester === student.semester);
    
    for (const sub of studentSubjects) {
      const marks = {
        studentId: student.id,
        subjectId: sub.id,
        cia1_test: Math.floor(Math.random() * 20) + 10,
        cia1_assignment: 5,
        cia1_attendance: 5,
        cia2_test: Math.floor(Math.random() * 20) + 10,
        cia2_assignment: 5,
        cia2_attendance: 5,
        cia3_test: Math.floor(Math.random() * 20) + 10,
        cia3_assignment: 5,
        cia3_attendance: 5,
        internal: 0, // Will calculate later if needed
        isLocked: true,
        isApproved: true,
        approvedBy: admin ? admin.id : 1,
        approvedAt: new Date()
      };
      
      // Calculate total internal (out of 50 or 100 usually, let's just put a sum)
      marks.internal = marks.cia1_test + marks.cia2_test + marks.cia3_test;

      await prisma.marks.upsert({
        where: { studentId_subjectId: { studentId: student.id, subjectId: sub.id } },
        update: marks,
        create: marks
      });
    }
  }
  console.log('✓ Internal marks populated and approved');

  // 2. Attendance Eligibility Logic
  console.log('Calculating Attendance Eligibility...');
  for (const student of students) {
    const studentSubjects = subjects.filter(s => s.department === student.department && s.semester === student.semester);
    
    for (const sub of studentSubjects) {
      const attendance = await prisma.studentAttendance.findMany({
        where: { studentId: student.id, subjectId: sub.id }
      });
      
      const total = attendance.length;
      const present = attendance.filter(a => a.status === 'PRESENT').length;
      const percent = total > 0 ? (present / total) * 100 : 100;

      let status = 'ELIGIBLE';
      if (percent < 65) status = 'DETAINED';
      else if (percent < 75) status = 'CONDONATION';

      await prisma.attendanceEligibility.upsert({
        where: { 
          studentId_subjectId_semester: { 
            studentId: student.id, 
            subjectId: sub.id, 
            semester: student.semester 
          } 
        },
        update: { attendancePercent: percent, status: status },
        create: {
          studentId: student.id,
          subjectId: sub.id,
          semester: student.semester,
          attendancePercent: percent,
          status: status
        }
      });
    }
  }
  console.log('✓ Attendance eligibility calculated');

  console.log('--- Internal Marks and Eligibility Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
