const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepts() {
    const depts = await prisma.department.findMany({ select: { id: true, name: true, code: true } });
    console.log(JSON.stringify(depts, null, 2));
}

checkDepts().catch(console.error).finally(() => prisma.$disconnect());
