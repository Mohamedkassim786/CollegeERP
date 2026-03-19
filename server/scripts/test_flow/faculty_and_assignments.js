const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- Faculty and Assignments (Explicit Codes) ---');

  const cseDept = await prisma.department.findUnique({ where: { name: 'Computer Science and Engineering' } });
  const mechDept = await prisma.department.findUnique({ where: { name: 'Mechanical Engineering' } });

  if (!cseDept || !mechDept) {
    console.error('Departments not found!');
    return;
  }

  const subjects = await prisma.subject.findMany();

  // 1. Create Faculty
  const facultyData = [
    {
      staffId: 'CSE_FAC001',
      fullName: 'Dr. Alice (CSE)',
      department: cseDept.name,
      departmentId: cseDept.id,
      email: 'alice@college.edu',
      password: await bcrypt.hash('password123', 10),
      isFirstLogin: false
    },
    {
      staffId: 'MECH_FAC001',
      fullName: 'Dr. Bob (MECH)',
      department: mechDept.name,
      departmentId: mechDept.id,
      email: 'bob@college.edu',
      password: await bcrypt.hash('password123', 10),
      isFirstLogin: false
    }
  ];

  const faculties = {};
  for (const f of facultyData) {
    faculties[f.staffId] = await prisma.faculty.upsert({
      where: { staffId: f.staffId },
      update: f,
      create: f
    });
  }
  console.log('✓ Faculty members ensured');

  // 2. Recreate Assignments using Explicit Codes
  const aliceId = faculties['CSE_FAC001'].id;
  const bobId = faculties['MECH_FAC001'].id;

  await prisma.facultyAssignment.deleteMany({
    where: { facultyId: { in: [aliceId, bobId] } }
  });

  const cseAliceCodes = ['CSE201', 'CSE202', 'CSE203'];
  const mechBobCodes = ['MECH401', 'MECH402', 'MECH403'];

  for (const code of cseAliceCodes) {
    const sub = subjects.find(s => s.code === code);
    if (sub) {
      await prisma.facultyAssignment.create({
        data: {
          facultyId: aliceId,
          subjectId: sub.id,
          section: 'A',
          department: cseDept.name
        }
      });
      console.log(`✓ Assigned ${code} to Alice`);
    }
  }

  for (const code of mechBobCodes) {
    const sub = subjects.find(s => s.code === code);
    if (sub) {
      await prisma.facultyAssignment.create({
        data: {
          facultyId: bobId,
          subjectId: sub.id,
          section: 'A',
          department: mechDept.name
        }
      });
      console.log(`✓ Assigned ${code} to Bob`);
    }
  }

  console.log('--- Faculty and Assignments Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
