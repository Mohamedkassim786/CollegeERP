const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function run() {
    try {
        const hashed = await bcrypt.hash('extpassword', 10);
        await prisma.user.upsert({
            where: { username: 'external_test' },
            update: { password: hashed, role: 'EXTERNAL_STAFF', fullName: 'John External' },
            create: { username: 'external_test', password: hashed, role: 'EXTERNAL_STAFF', fullName: 'John External' }
        });
        console.log('✅ External staff seeded');
    } catch (e) {
        console.error('❌ Seeding failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
