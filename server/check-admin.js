const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: {
        username: true,
        role: true,
        fullName: true
      }
    });
    console.log('--- Users in Database ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- End of List ---');
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
