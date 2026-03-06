const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const grades = await prisma.gradeSettings.findMany({
        where: { regulation: '2021' }
    });
    console.log('--- Grade Settings (2021) ---');
    console.log(JSON.stringify(grades, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
