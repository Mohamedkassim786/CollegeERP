const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const students = await prisma.student.findMany({ select: { registerNumber: true, rollNo: true }, take: 20 });
    console.log(JSON.stringify(students, null, 2));
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
