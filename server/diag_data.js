
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const departments = await prisma.department.findMany();
        console.log("DEPARTMENTS IN MODEL:");
        departments.forEach(d => console.log(`- ${d.name} (${d.code})`));

        const subjects = await prisma.subject.findMany({ take: 20 });
        console.log("\nSUBJECT DEPARTMENTS:");
        const subDepts = new Set(subjects.map(s => s.department));
        subDepts.forEach(d => console.log(`- ${d}`));

        const students = await prisma.student.findMany({ take: 20 });
        console.log("\nSTUDENT DEPARTMENTS:");
        const stuDepts = new Set(students.map(s => s.department));
        stuDepts.forEach(d => console.log(`- ${d}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
