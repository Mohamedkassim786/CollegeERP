const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.timetable.updateMany({
        where: {
            year: 1,
            department: { not: 'FIRST_YEAR' }
        },
        data: {
            department: 'FIRST_YEAR'
        }
    });
    console.log(`Updated ${updated.count} timetable entries for year 1 to 'FIRST_YEAR'.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
