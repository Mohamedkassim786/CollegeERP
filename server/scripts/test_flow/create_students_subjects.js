const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Student and Subject Creation ---');

  const cseDept = await prisma.department.findUnique({ where: { name: 'Computer Science and Engineering' } });
  const mechDept = await prisma.department.findUnique({ where: { name: 'Mechanical Engineering' } });
  const activeAY = await prisma.academicYear.findFirst({ where: { year: '2023-2024' } });

  const cseSec = await prisma.section.findUnique({
    where: {
      name_semester_departmentId_academicYearId: {
        name: 'A',
        semester: 2,
        departmentId: cseDept.id,
        academicYearId: activeAY.id
      }
    }
  });

  const mechSec = await prisma.section.findUnique({
    where: {
      name_semester_departmentId_academicYearId: {
        name: 'A',
        semester: 4,
        departmentId: mechDept.id,
        academicYearId: activeAY.id
      }
    }
  });

  // 1. Create Subjects
  const subjects = [
    // CSE Sem 2
    { code: 'CSE201', name: 'Digital Logic', type: 'DEPARTMENT', category: 'THEORY', sem: 2, dept: cseDept.name },
    { code: 'CSE202', name: 'Data Structures Lab', type: 'DEPARTMENT', category: 'LAB', sem: 2, dept: cseDept.name },
    { code: 'CSE203', name: 'Object Oriented Programming', type: 'DEPARTMENT', category: 'INTEGRATED', sem: 2, dept: cseDept.name, theoryCredit: 3, labCredit: 1 },
    // MECH Sem 4
    { code: 'MECH401', name: 'Fluid Mechanics', type: 'DEPARTMENT', category: 'THEORY', sem: 4, dept: mechDept.name },
    { code: 'MECH402', name: 'Manufacturing Processes Lab', type: 'DEPARTMENT', category: 'LAB', sem: 4, dept: mechDept.name },
    { code: 'MECH403', name: 'Thermal Engineering', type: 'DEPARTMENT', category: 'INTEGRATED', sem: 4, dept: mechDept.name, theoryCredit: 3, labCredit: 1 },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: {
        code: s.code,
        name: s.name,
        type: s.type,
        subjectCategory: s.category,
        semester: s.sem,
        department: s.dept,
        theoryCredit: s.theoryCredit || 3,
        labCredit: s.labCredit || 0,
        credits: (s.theoryCredit || 0) + (s.labCredit || 0) || 3
      }
    });
  }
  console.log('✓ Subjects created');

  // 2. Create Students
  const cseStudents = [];
  for (let i = 1; i <= 5; i++) {
    cseStudents.push({
      rollNo: `24CSE${i.toString().padStart(3, '0')}`,
      registerNumber: `711124104${i.toString().padStart(3, '0')}`,
      name: `CSE Student ${i}`,
      department: cseDept.name,
      departmentId: cseDept.id,
      section: 'A',
      sectionId: cseSec.id,
      year: 1,
      semester: 2,
      currentSemester: 2,
      academicYearId: activeAY.id,
      regulation: '2021',
      status: 'ACTIVE'
    });
  }

  const mechStudents = [];
  for (let i = 1; i <= 5; i++) {
    mechStudents.push({
      rollNo: `23MECH${i.toString().padStart(3, '0')}`,
      registerNumber: `711123114${i.toString().padStart(3, '0')}`,
      name: `MECH Student ${i}`,
      department: mechDept.name,
      departmentId: mechDept.id,
      section: 'A',
      sectionId: mechSec.id,
      year: 2,
      semester: 4,
      currentSemester: 4,
      academicYearId: activeAY.id,
      regulation: '2021',
      status: 'ACTIVE'
    });
  }

  for (const s of [...cseStudents, ...mechStudents]) {
    await prisma.student.upsert({
      where: { rollNo: s.rollNo },
      update: s,
      create: s
    });
  }
  console.log('✓ Students created');

  console.log('--- Student and Subject Creation Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
