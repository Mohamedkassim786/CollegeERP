const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAcademicYears() {
  const years = await prisma.academicYear.findMany();
  console.log('Current Academic Years in DB:');
  console.log(JSON.stringify(years, null, 2));
}

checkAcademicYears()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
