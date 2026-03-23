const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testToggle(id) {
  const targetId = parseInt(id);
  console.log(`Testing Activation for ID: ${targetId}`);
  
  await prisma.$transaction([
    prisma.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    }),
    prisma.academicYear.update({
      where: { id: targetId },
      data: { isActive: true }
    })
  ]);
  
  const years = await prisma.academicYear.findMany();
  console.log('Resulting Academic Years:');
  console.log(JSON.stringify(years, null, 2));
}

// Test with ID 1 (2025-2026)
testToggle(1)
  .then(() => testToggle(2)) // Then test with ID 2 (2023-2024)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
