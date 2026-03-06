const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        where: { registerNumber: { in: ['8124123123', '8124124124'] } },
        include: { marks: { where: { subjectId: 30 } } }
    });
    const grades = await prisma.gradeSettings.findMany({ where: { regulation: '2021' } });

    for (const student of students) {
        const cia = student.marks[0];
        const ext = await prisma.externalMark.findFirst({
            where: { subjectId: 30, dummyNumber: student.registerNumber }
        });

        console.log(`\n--- Student: ${student.name} ---`);
        console.log(`Internal (Raw): ${cia?.internal}, External (Raw): ${ext?.rawExternal100}`);

        const internalVal = cia?.internal || 0;
        const externalVal = ext?.rawExternal100 || 0;
        const totalMarks = Math.round(internalVal + externalVal);
        const isExternalPass = externalVal >= 16;

        console.log(`Total: ${totalMarks}, ExtPass: ${isExternalPass}`);

        const match = grades.find(g => totalMarks >= g.minPercentage && totalMarks <= g.maxPercentage);
        console.log(`Matched Grade: ${match ? match.grade : 'NONE'} (Status: ${match ? match.resultStatus : 'N/A'})`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
