const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        where: {
            name: { in: ['MOHAMED', 'KASSIM'] }
        },
        include: {
            marks: {
                where: {
                    subject: { code: 'CS444' }
                },
                include: {
                    subject: true,
                    endSemMarks: true
                }
            },
            dummyMappings: {
                where: {
                    subjectCode: 'CS444'
                }
            }
        }
    });

    for (const student of students) {
        console.log(`--- Student: ${student.name} (${student.registerNumber}) ---`);
        const m = student.marks[0];
        if (m) {
            console.log("Marks Entry:", {
                internal: m.internal,
                endSemMarks: m.endSemMarks
            });
        }

        const mapping = student.dummyMappings[0];
        const dummy = mapping?.dummyNumber;
        console.log("Dummy Number:", dummy);

        // Fetch External Marks
        const extMarks = await prisma.externalMark.findMany({
            where: {
                subjectId: m.subjectId,
                OR: [
                    { dummyNumber: dummy || "NOT_FOUND" },
                    { dummyNumber: student.registerNumber }
                ]
            }
        });
        console.log("External Marks Records:", JSON.stringify(extMarks, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
