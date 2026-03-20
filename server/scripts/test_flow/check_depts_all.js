const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDepts() {
    const s = await prisma.student.findFirst({ select: { id: true, department: true }});
    const f = await prisma.faculty.findFirst({ select: { id: true, department: true }});
    const fa = await prisma.facultyAssignment.findFirst({ select: { id: true, department: true }});
    const tt = await prisma.timetable.findFirst({ select: { id: true, department: true }});
    
    console.log("Student:", s?.department);
    console.log("Faculty:", f?.department);
    console.log("FacultyAssignment:", fa?.department);
    console.log("Timetable:", tt?.department);
}

checkDepts().catch(console.error).finally(() => prisma.$disconnect());
