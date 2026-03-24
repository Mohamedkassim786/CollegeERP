const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Migrating legacy grades: RA -> U, AB -> UA...');

    // Update resultStatus and grade in EndSemMarks
    const esmResults = await prisma.endSemMarks.updateMany({
        where: { grade: 'RA' },
        data: { grade: 'U' }
    });
    console.log(`Updated ${esmResults.count} EndSemMarks RA -> U`);

    const esmAbsent = await prisma.endSemMarks.updateMany({
        where: { resultStatus: 'AB' },
        data: { resultStatus: 'UA', grade: 'UA' }
    });
    console.log(`Updated ${esmAbsent.count} EndSemMarks AB -> UA`);

    const esmAbsentGrade = await prisma.endSemMarks.updateMany({
        where: { grade: 'AB' },
        data: { grade: 'UA', resultStatus: 'UA' }
    });
    console.log(`Updated ${esmAbsentGrade.count} EndSemMarks AB grade -> UA`);

    // Update ArrearAttempt
    const aaResults = await prisma.arrearAttempt.updateMany({
        where: { grade: 'RA' },
        data: { grade: 'U' }
    });
    console.log(`Updated ${aaResults.count} ArrearAttempt RA -> U`);

    const aaAbsent = await prisma.arrearAttempt.updateMany({
        where: { resultStatus: 'AB' },
        data: { resultStatus: 'UA', grade: 'UA' }
    });
    console.log(`Updated ${aaAbsent.count} ArrearAttempt AB -> UA`);

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
