const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  console.log(depts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
