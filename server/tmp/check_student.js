const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudent() {
  try {
    const student = await prisma.student.findUnique({
      where: { rollNo: '23MECH002' }
    });
    if (student) {
      console.log(`Student: ${student.name}, Year: ${student.year}, Semester: ${student.semester}, Section: ${student.section}, Dept: ${student.department}`);
    } else {
      const all = await prisma.student.findMany({ take: 3 });
      console.log('Sample students:', all.map(s => `${s.rollNo} - Year: ${s.year}, Sem: ${s.semester}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();
