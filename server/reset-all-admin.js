const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    const newPassword = 'admin';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.updateMany({
      where: {
        username: { in: ['admin', 'coe', 'principal', 'chief_secretary'] }
      },
      data: { password: hashedPassword }
    });
    
    console.log(`Passwords for admin, coe, principal, and chief_secretary have been reset to: ${newPassword}`);
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
