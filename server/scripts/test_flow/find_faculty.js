const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allFaculty = await prisma.faculty.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Alice' } },
        { fullName: { contains: 'CSE' } },
        { staffId: { contains: 'CSE' } }
      ]
    }
  });
  console.log('Faculty matching "Alice" or "CSE":');
  console.table(allFaculty.map(f => ({ id: f.id, staffId: f.staffId, fullName: f.fullName })));
}

main().finally(() => prisma.$disconnect());
