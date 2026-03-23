const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const years = [1, 2, 3, 4];
  for (const year of years) {
    const students = await prisma.student.findMany({ where: { year }, include: { sectionRef: true } });
    console.log(`--- Year ${year} (Total: ${students.length}) ---`);
    students.slice(0, 3).forEach(s => {
      console.log(`ID: ${s.id}, Roll: ${s.rollNo}, DeptID: ${s.departmentId}, SecID: ${s.sectionId}, SecType: ${s.sectionRef?.type}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
