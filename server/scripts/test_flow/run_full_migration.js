const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dayMap = {
    'Monday': 'MON', 'MONDAY': 'MON',
    'Tuesday': 'TUE', 'TUESDAY': 'TUE',
    'Wednesday': 'WED', 'WEDNESDAY': 'WED',
    'Thursday': 'THU', 'THURSDAY': 'THU',
    'Friday': 'FRI', 'FRIDAY': 'FRI',
    'Saturday': 'SAT', 'SATURDAY': 'SAT',
    'Sunday': 'SUN', 'SUNDAY': 'SUN'
};

const deptMap = {
    'Mechanical Engineering': 'MECH',
    'Computer Science and Engineering': 'CSE',
    'Computer Science': 'CSE',
    'First Year': 'FIRST_YEAR',
    'Science and Humanities': 'S&H' // maybe?
};

async function main() {
    let ttUpdated = 0;
    const timetables = await prisma.timetable.findMany();
    for (const t of timetables) {
        let newDay = dayMap[t.day] || t.day;
        let newDept = deptMap[t.department] || t.department;
        
        if (newDay !== t.day || newDept !== t.department) {
            await prisma.timetable.update({
                where: { id: t.id },
                data: { day: newDay, department: newDept }
            });
            ttUpdated++;
        }
    }
    console.log(`Updated ${ttUpdated} Timetable records.`);

    let faUpdated = 0;
    const faculties = await prisma.faculty.findMany();
    for (const f of faculties) {
        let newDept = deptMap[f.department];
        if (newDept && newDept !== f.department) {
            await prisma.faculty.update({
                where: { id: f.id },
                data: { department: newDept }
            });
            faUpdated++;
        }
    }
    console.log(`Updated ${faUpdated} Faculty records.`);
    
    let assignUpdated = 0;
    const assignments = await prisma.facultyAssignment.findMany();
    for (const a of assignments) {
        let newDept = deptMap[a.department];
        if (newDept && newDept !== a.department) {
            await prisma.facultyAssignment.update({
                where: { id: a.id },
                data: { department: newDept }
            });
            assignUpdated++;
        }
    }
    console.log(`Updated ${assignUpdated} FacultyAssignment records.`);

    let stUpdated = 0;
    const students = await prisma.student.findMany();
    for (const s of students) {
        let newDept = deptMap[s.department];
        if (newDept && newDept !== s.department) {
            await prisma.student.update({
                where: { id: s.id },
                data: { department: newDept }
            });
            stUpdated++;
        }
    }
    console.log(`Updated ${stUpdated} Student records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
