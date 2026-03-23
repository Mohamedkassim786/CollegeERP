const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const mech = await prisma.department.findUnique({ where: { code: 'MECH' } });
    if (!mech) {
        console.log('MECH department not found');
        return;
    }
    const sections = await prisma.section.findMany({
        where: { departmentId: mech.id },
        orderBy: [{ semester: 'asc' }, { name: 'asc' }]
    });
    console.log('MECH Sections:', JSON.stringify(sections, null, 2));

    const timetableSem4 = await prisma.timetable.findMany({
        where: { department: 'MECH', year: 2, semester: 4 }
    });
    console.log('MECH Year 2 Sem 4 TT Count:', timetableSem4.length);

    const timetableSem3 = await prisma.timetable.findMany({
        where: { department: 'MECH', year: 2, semester: 3 }
    });
    console.log('MECH Year 2 Sem 3 TT Count:', timetableSem3.length);
}
main().catch(console.error).finally(() => prisma.$disconnect());


