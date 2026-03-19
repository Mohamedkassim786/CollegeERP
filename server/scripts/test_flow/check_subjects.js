const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cseSubjects = await prisma.subject.findMany({
    where: { code: { contains: 'CSE' } }
  });
  console.log('CSE Subjects:');
  console.table(cseSubjects.map(s => ({ id: s.id, code: s.code, name: s.name, dept: s.department })));

  const cseDept = await prisma.department.findUnique({ where: { name: 'Computer Science and Engineering' } });
  console.log('CSE Dept Name in DB:', cseDept?.name);
}

main().finally(() => prisma.$disconnect());
