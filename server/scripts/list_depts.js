const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany();
  depts.forEach(d => console.log(`ID: ${d.id}, Name: ${d.name}, HOD: ${d.hodName}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
