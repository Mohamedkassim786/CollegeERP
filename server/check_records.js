const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- ALL External Marks for Subject 31 ---');
    const marks = await prisma.externalMark.findMany({
        where: { subjectId: 31 }
    });
    console.log(JSON.stringify(marks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
