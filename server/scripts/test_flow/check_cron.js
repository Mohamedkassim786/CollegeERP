const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const today = new Date();
    const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayName = WEEKDAYS[today.getDay()];
    console.log('Day Name:', dayName);
    const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
    const endOfDay   = new Date(new Date(today).setHours(23, 59, 59, 999));

    const timetableEntries = await prisma.timetable.findMany({
        where: { day: dayName },
        include: {
            faculty: {
                select: { id: true, fullName: true, department: true }
            },
            subject: true
        }
    });

    console.log(`Timetable entries for today (${dayName}):`, timetableEntries.length);
    const mechFacultyEntries = timetableEntries.filter(e => e.faculty?.department === 'Mechanical');
    console.log(`Timetable entries for Mechanical faculty:`, mechFacultyEntries.length);

    const facultyIds = [...new Set(mechFacultyEntries.map(e => e.facultyId))];
    console.log(`Mechanical Faculty IDs with class today:`, facultyIds);

    for (const fid of facultyIds) {
        const submitted = await prisma.studentAttendance.findFirst({
            where: {
                facultyId: fid,
                createdAt: { gte: startOfDay, lte: endOfDay }
            }
        });
        console.log(`Faculty ID ${fid} submitted attendance today:`, !!submitted);
    }

    const hod = await prisma.faculty.findFirst({
        where: {
            role: 'HOD',
            department: 'Mechanical',
            isActive: true
        }
    });

    console.log('Mechanical HOD:', hod);
}

checkData().finally(() => prisma.$disconnect());
