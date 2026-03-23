const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetYear = '2025-2026';
  const target = await prisma.academicYear.findFirst({ where: { year: targetYear } });
  
  if (!target) {
    console.log(`Error: ${targetYear} not found`);
    return;
  }

  await prisma.$transaction([
    prisma.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    }),
    prisma.academicYear.update({
      where: { id: target.id },
      data: { isActive: true }
    })
  ]);
  
  console.log(`Success: ${targetYear} (ID: ${target.id}) is now the only active year`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
