const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.faculty.findUnique({
    where: { staffId: 'CSE_FAC001' }
  });
  console.log('Alice:', JSON.stringify(alice, null, 2));

  if (alice) {
    const assignments = await prisma.facultyAssignment.findMany({
      where: { facultyId: alice.id },
      include: { subject: true }
    });
    console.log('Assignments:', JSON.stringify(assignments, null, 2));
    
    // Check if subjects exist for this dept/sem
    const subjects = await prisma.subject.findMany({
      where: { semester: 2, department: alice.department }
    });
    console.log('Available Subjects for Dept/Sem:', JSON.stringify(subjects, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
