const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const username = 'CSE_FAC001';
  const user = await prisma.user.findUnique({ where: { username } });
  const faculty = await prisma.faculty.findUnique({ where: { staffId: username } });

  console.log('User Record:', JSON.stringify(user, null, 2));
  console.log('Faculty Record:', JSON.stringify(faculty, null, 2));

  if (user && faculty) {
    console.log('--- COLLISION DETECTED ---');
    console.log(`The login will prioritize the User table (ID: ${user.id}) over the Faculty table (ID: ${faculty.id}).`);
  } else {
    console.log('No collision detected.');
  }
}

main().finally(() => prisma.$disconnect());
