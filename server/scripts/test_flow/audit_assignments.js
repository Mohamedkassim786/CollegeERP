const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Faculty/Assignment Audit ---');
  const faculty = await prisma.faculty.findUnique({
    where: { staffId: 'CSE_FAC001' }
  });
  console.log('Faculty Alice:', faculty);

  const assignments = await prisma.facultyAssignment.findMany({
    where: { facultyId: faculty?.id }
  });
  console.log('Assignments for Alice:', assignments);

  const subjects = await prisma.subject.findMany({
    where: { department: faculty?.department }
  });
  console.log('Subjects for Dept:', subjects.length);

  console.log('--- Audit End ---');
}

main().finally(() => prisma.$disconnect());
