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
  const yearStr = '2025-2026';
  
  // Use a transaction to ensure only one year is active
  const activeAY = await prisma.$transaction(async (tx) => {
    // Deactivate all existing years
    await tx.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Upsert the desired year as active
    const year = await tx.academicYear.findFirst({ where: { year: yearStr } });
    if (year) {
      return await tx.academicYear.update({
        where: { id: year.id },
        data: { isActive: true }
      });
    } else {
      return await tx.academicYear.create({
        data: { year: yearStr, isActive: true }
      });
    }
  });

  console.log(`✓ Academic Year ${yearStr} set as active`);

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
