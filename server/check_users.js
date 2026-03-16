const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, isDisabled: true }
  });
  console.log(users);

  console.log('--- FACULTY ---');
  const faculty = await prisma.faculty.findMany({
    take: 5,
    select: { id: true, staffId: true, role: true, isActive: true }
  });
  console.log(faculty);

  console.log('--- STUDENTS ---');
  const students = await prisma.student.findMany({
    take: 5,
    select: { id: true, rollNo: true, department: true }
  });
  console.log(students);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
