const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const departments = await prisma.department.findMany();
        console.log('--- Departments ---');
        departments.forEach(d => console.log(`ID: ${d.id}, Name: "${d.name}", Code: "${d.code}"`));

        const subjects = await prisma.subject.findMany();
        console.log('\n--- Subjects (First 10) ---');
        subjects.slice(0, 10).forEach(s => {
            console.log(`ID: ${s.id}, Code: ${s.code}, Name: ${s.name}, Dept: "${s.department}", Sem: ${s.semester}, Type: ${s.type}`);
        });

        const studentDepts = await prisma.student.findMany({ select: { department: true }, distinct: ['department'] });
        console.log('\n--- Unique Student Departments ---');
        console.log(studentDepts.map(s => `"${s.department}"`).join(', '));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
