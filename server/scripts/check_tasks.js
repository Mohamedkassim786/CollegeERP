const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.externalStaffTask.findMany({
        include: {
            staff: true,
            subject: true
        }
    });
    console.log('TASKS:', JSON.stringify(tasks, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
