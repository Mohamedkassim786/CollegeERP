const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding grade settings for 2021 Regulation...');

    const grades = [
        { grade: 'O', gradePoint: 10, minPercentage: 91, maxPercentage: 100, regulation: '2021' },
        { grade: 'A+', gradePoint: 9, minPercentage: 81, maxPercentage: 90, regulation: '2021' },
        { grade: 'A', gradePoint: 8, minPercentage: 71, maxPercentage: 80, regulation: '2021' },
        { grade: 'B+', gradePoint: 7, minPercentage: 61, maxPercentage: 70, regulation: '2021' },
        { grade: 'B', gradePoint: 6, minPercentage: 50, maxPercentage: 60, regulation: '2021' },
        { grade: 'RA', gradePoint: 0, minPercentage: 0, maxPercentage: 49, regulation: '2021' },
        { grade: 'AB', gradePoint: 0, minPercentage: -1, maxPercentage: -1, regulation: '2021' }
    ];

    for (const g of grades) {
        await prisma.gradeSettings.upsert({
            where: {
                regulation_grade: {
                    regulation: g.regulation,
                    grade: g.grade
                }
            },
            update: g,
            create: g
        });
    }

    console.log('Grade settings seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
