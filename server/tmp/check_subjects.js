const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubjects() {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        semester: 4,
        OR: [
          { department: 'MECH' },
          { type: 'COMMON' }
        ]
      }
    });
    console.log('Subjects found:', subjects.length);
    subjects.forEach(s => console.log(`${s.code}: ${s.name} (${s.department})`));

    const allSubjectsCount = await prisma.subject.count();
    console.log('Total subjects count:', allSubjectsCount);

    const first5 = await prisma.subject.findMany({ take: 5 });
    console.log('Sample subjects:', first5.map(s => `${s.code} - Dept: ${s.department}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubjects();
