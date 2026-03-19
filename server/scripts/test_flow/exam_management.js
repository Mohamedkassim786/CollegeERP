const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Exam Management: Sessions, Halls, Allocations, Dummy Numbers ---');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const students = await prisma.student.findMany();
  const subjects = await prisma.subject.findMany();

  // 1. Create Exam Session
  const session = await prisma.examSession.upsert({
    where: { id: 1 },
    update: {},
    create: {
      examName: 'End Semester April 2024',
      examDate: new Date('2024-04-15'),
      month: 'April',
      year: '2024',
      session: 'FN',
      examMode: 'END_SEM',
      createdBy: admin ? admin.id : 1
    }
  });
  console.log('✓ Exam Session created');

  // Link subjects to session
  for (const sub of subjects) {
    await prisma.examSessionSubjects.upsert({
      where: { examSessionId_subjectId: { examSessionId: session.id, subjectId: sub.id } },
      update: {},
      create: {
        examSessionId: session.id,
        subjectId: sub.id,
        examDate: new Date('2024-04-15')
      }
    });
  }

  // 2. Create Hall
  const hall = await prisma.hall.upsert({
    where: { id: 1 },
    update: {},
    create: {
      hallName: 'Exam Hall 101',
      blockName: 'Main Block',
      examSessionId: session.id,
      capacity: 40,
      totalBenches: 20,
      isActive: true
    }
  });
  console.log('✓ Hall created');

  // 3. Hall Allocation & Dummy Numbers
  console.log('Allocating students...');
  let seatCounter = 1;
  for (const student of students) {
    const studentSubjects = subjects.filter(s => s.department === student.department && s.semester === student.semester);
    
    for (const sub of studentSubjects) {
      // Create Hall Allocation
      await prisma.hallAllocation.upsert({
        where: { 
          examSessionId_studentId_subjectId: { 
            examSessionId: session.id, 
            studentId: student.id, 
            subjectId: sub.id 
          } 
        },
        update: {},
        create: {
          examSessionId: session.id,
          hallId: hall.id,
          studentId: student.id,
          subjectId: sub.id,
          department: student.department || 'Unknown',
          year: student.year,
          seatNumber: `S${seatCounter++}`,
          examDate: new Date('2024-04-15'),
          session: 'FN'
        }
      });

      // Assign Dummy Number (usually for theory papers)
      if (sub.subjectCategory === 'THEORY' || sub.subjectCategory === 'INTEGRATED') {
        const dummyNum = `DN${Math.floor(100000 + Math.random() * 900000)}`;
        await prisma.subjectDummyMapping.upsert({
          where: { studentId_subjectId: { studentId: student.id, subjectId: sub.id } },
          update: { dummyNumber: dummyNum },
          create: {
            studentId: student.id,
            subjectId: sub.id,
            dummyNumber: dummyNum,
            originalRegisterNo: student.registerNumber || student.rollNo,
            subjectCode: sub.code,
            department: student.department || 'Unknown',
            semester: student.semester,
            section: student.section,
            academicYear: '2023-2024'
          }
        });
      }
    }
  }
  console.log('✓ Student allocations and dummy numbers generated');

  console.log('--- Exam Management Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
