const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Initial Setup: Departments, Academic Years, Sections ---');

  // 1. Departments
  const cse = await prisma.department.upsert({
    where: { name: 'Computer Science and Engineering' },
    update: {},
    create: {
      name: 'Computer Science and Engineering',
      code: 'CSE',
      type: 'Academic',
      degree: 'B.E.',
      sections: 'A,B',
      years: '1,2,3,4'
    }
  });
  console.log('✓ CSE Department ensured');

  const mech = await prisma.department.upsert({
    where: { name: 'Mechanical Engineering' },
    update: {},
    create: {
      name: 'Mechanical Engineering',
      code: 'MECH',
      type: 'Academic',
      degree: 'B.E.',
      sections: 'A',
      years: '2,3,4'
    }
  });
  console.log('✓ MECH Department ensured');

  // 2. Academic Year
  const ay = await prisma.academicYear.upsert({
    where: { id: 1 }, // Assuming ID 1 or just find by year
    create: {
      year: '2023-2024',
      isActive: true
    },
    update: {
      isActive: true
    }
  });
  // Since year might not be unique in schema (it's not marked @unique), we use findFirst or similar if upsert by ID is not reliable.
  // Actually, schema says "year String" (no unique). Let's just find or create.
  let activeAY = await prisma.academicYear.findFirst({ where: { year: '2023-2024' } });
  if (!activeAY) {
    activeAY = await prisma.academicYear.create({
      data: { year: '2023-2024', isActive: true }
    });
  } else {
    await prisma.academicYear.update({
      where: { id: activeAY.id },
      data: { isActive: true }
    });
  }
  console.log('✓ Academic Year 2023-2024 set as active');

  // 3. Sections
  // CSE 1st Year Sem 2 Section A
  const cseSec = await prisma.section.upsert({
    where: {
      name_semester_departmentId_academicYearId: {
        name: 'A',
        semester: 2,
        departmentId: cse.id,
        academicYearId: activeAY.id
      }
    },
    update: {},
    create: {
      name: 'A',
      semester: 2,
      type: 'Regular',
      departmentId: cse.id,
      academicYearId: activeAY.id
    }
  });
  console.log('✓ CSE Section A (Sem 2) ensured');

  // MECH 2nd Year Sem 4 (Sem 2 of 2nd year) Section A
  const mechSec = await prisma.section.upsert({
    where: {
      name_semester_departmentId_academicYearId: {
        name: 'A',
        semester: 4,
        departmentId: mech.id,
        academicYearId: activeAY.id
      }
    },
    update: {},
    create: {
      name: 'A',
      semester: 4,
      type: 'Regular',
      departmentId: mech.id,
      academicYearId: activeAY.id
    }
  });
  console.log('✓ MECH Section A (Sem 4) ensured');

  console.log('--- Initial Setup Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
