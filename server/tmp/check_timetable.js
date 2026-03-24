const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTimetable() {
  try {
    const timetable = await prisma.timetable.findMany({
      where: {
        semester: 4,
        section: 'A'
      }
    });
    console.log('Timetable records found:', timetable.length);
    timetable.forEach(t => console.log(`Day: ${t.day}, Period: ${t.period}, Dept: ${t.department}`));

    const allTTCount = await prisma.timetable.count();
    console.log('Total timetable records:', allTTCount);

    const samples = await prisma.timetable.findMany({ take: 5 });
    console.log('Sample TT Depts:', samples.map(t => t.department));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimetable();
