const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedGrades() {
    const grades = [
        { regulation: '2021', grade: 'O', minPercentage: 90, maxPercentage: 100, gradePoint: 10, resultStatus: 'PASS' },
        { regulation: '2021', grade: 'A+', minPercentage: 80, maxPercentage: 89, gradePoint: 9, resultStatus: 'PASS' },
        { regulation: '2021', grade: 'A', minPercentage: 70, maxPercentage: 79, gradePoint: 8, resultStatus: 'PASS' },
        { regulation: '2021', grade: 'B+', minPercentage: 60, maxPercentage: 69, gradePoint: 7, resultStatus: 'PASS' },
        { regulation: '2021', grade: 'B', minPercentage: 50, maxPercentage: 59, gradePoint: 6, resultStatus: 'PASS' },
        { regulation: '2021', grade: 'RA', minPercentage: 0, maxPercentage: 49, gradePoint: 0, resultStatus: 'FAIL' },
    ];

    for (const g of grades) {
        await prisma.gradeSettings.upsert({
            where: { regulation_grade: { regulation: g.regulation, grade: g.grade } },
            update: g,
            create: g
        });
    }
    console.log('Grade settings seeded successfully');
}

seedGrades()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
