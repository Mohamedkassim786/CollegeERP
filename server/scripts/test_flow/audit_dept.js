const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Department/Student Data Check ---');
  const depts = await prisma.department.findMany();
  console.log('Departments in DB:');
  console.table(depts.map(d => ({ id: d.id, name: d.name, code: d.code })));

  const firstStudent = await prisma.student.findFirst({
    where: { rollNo: '24CSE001' }
  });
  console.log('Sample Student (24CSE001):');
  console.log({
    rollNo: firstStudent.rollNo,
    department: firstStudent.department,
    departmentId: firstStudent.departmentId,
    semester: firstStudent.semester,
    section: firstStudent.section
  });

  const mechStudent = await prisma.student.findFirst({
    where: { rollNo: '23MECH001' }
  });
  console.log('Sample Student (23MECH001):');
  console.log({
    rollNo: mechStudent.rollNo,
    department: mechStudent.department,
    departmentId: mechStudent.departmentId,
    semester: mechStudent.semester,
    section: mechStudent.section
  });

  console.log('--- Check End ---');
}

main().finally(() => prisma.$disconnect());
