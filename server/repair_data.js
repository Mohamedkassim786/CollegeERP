const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const subjects = await prisma.subject.findMany();
    const subMap = {};
    subjects.forEach(s => subMap[s.id] = s);

    const extMarks = await prisma.externalMark.findMany();
    console.log(`Processing ${extMarks.length} records...`);

    for (const em of extMarks) {
        const sub = subMap[em.subjectId];
        if (!sub) continue;

        let max = 60;
        if (sub.subjectCategory === 'LAB') max = 40;
        if (sub.subjectCategory === 'INTEGRATED') max = 25;

        if (em.rawExternal100 > max) {
            const scaled = (em.rawExternal100 / 100) * max;
            await prisma.externalMark.update({
                where: { id: em.id },
                data: {
                    rawExternal100: scaled,
                    convertedExternal60: scaled
                }
            });
            console.log(`Rescaled ID ${em.id}: ${em.rawExternal100} -> ${scaled} (Subject: ${sub.code})`);
        }
    }

    // Also repair SubjectDummyMapping.marks
    const mappings = await prisma.subjectDummyMapping.findMany();
    for (const m of mappings) {
        const sub = subMap[m.subjectId];
        if (!sub || m.marks === null) continue;

        let max = 60;
        if (sub.subjectCategory === 'LAB') max = 40;
        if (sub.subjectCategory === 'INTEGRATED') max = 25; // marks in mapping for integrated is theory part

        if (m.marks > max) {
            const scaled = (m.marks / 100) * max;
            await prisma.subjectDummyMapping.update({
                where: { id: m.id },
                data: { marks: scaled }
            });
            console.log(`Rescaled Mapping ID ${m.id}: ${m.marks} -> ${scaled}`);
        }
    }

    console.log('Repair completed.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
