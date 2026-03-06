const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Grade Settings...');

    const regulations = ['2021', '2023'];
    const grades = [
        { grade: 'O', minPercentage: 90, maxPercentage: 100, gradePoint: 10, resultStatus: 'PASS' },
        { grade: 'A+', minPercentage: 80, maxPercentage: 89, gradePoint: 9, resultStatus: 'PASS' },
        { grade: 'A', minPercentage: 70, maxPercentage: 79, gradePoint: 8, resultStatus: 'PASS' },
        { grade: 'B+', minPercentage: 60, maxPercentage: 69, gradePoint: 7, resultStatus: 'PASS' },
        { grade: 'B', minPercentage: 50, maxPercentage: 59, gradePoint: 6, resultStatus: 'PASS' },
        { grade: 'RA', minPercentage: 0, maxPercentage: 49, gradePoint: 0, resultStatus: 'FAIL' },
        { grade: 'AB', minPercentage: -1, maxPercentage: -1, gradePoint: 0, resultStatus: 'FAIL' }
    ];

    for (const reg of regulations) {
        for (const g of grades) {
            await prisma.gradeSettings.upsert({
                where: {
                    regulation_grade: {
                        regulation: reg,
                        grade: g.grade
                    }
                },
                update: g,
                create: {
                    regulation: reg,
                    ...g
                }
            });
        }
        console.log(`✅ Grades seeded for Regulation ${reg}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
