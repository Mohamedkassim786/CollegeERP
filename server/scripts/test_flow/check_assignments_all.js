const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allAssignments = await prisma.facultyAssignment.findMany({
    include: { faculty: true, subject: true }
  });
  console.log('Total Assignments:', allAssignments.length);
  allAssignments.forEach(a => {
    console.log(`ID: ${a.id}, Faculty: ${a.faculty.fullName} (ID: ${a.facultyId}), Subject: ${a.subject.name} (ID: ${a.subjectId})`);
  });
}

main().finally(() => prisma.$disconnect());
