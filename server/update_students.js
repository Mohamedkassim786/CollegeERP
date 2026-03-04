const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const result = await prisma.student.updateMany({
        where: {
            registerNumber: {
                in: ['812423103007', '812423103008', '812423103501']
            }
        },
        data: {
            status: 'PASSED_OUT',
            batch: '2020-2024',
            batchYear: '2020'
        }
    });
    console.log('Updated students:', result.count);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
