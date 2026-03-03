const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStats() {
    console.log("Checking Department Stats Data...");
    const depts = await prisma.department.findMany();

    for (const dept of depts) {
        console.log(`\nDept: ${dept.name} (Code: ${dept.code}, ID: ${dept.id})`);

        const facultyCount = await prisma.user.count({
            where: {
                role: 'FACULTY',
                OR: [
                    { department: dept.code },
                    { department: dept.name }
                ]
            }
        });

        const studentCount = await prisma.student.count({
            where: {
                OR: [
                    { departmentId: dept.id },
                    { department: dept.code },
                    { department: dept.name }
                ]
            }
        });

        const subjectCount = await prisma.subject.count({
            where: {
                OR: [
                    { department: dept.code },
                    { department: dept.name }
                ]
            }
        });

        console.log(`- Faculty: ${facultyCount}`);
        console.log(`- Students: ${studentCount}`);
        console.log(`- Subjects: ${subjectCount}`);

        // Debug sample data if 0
        if (facultyCount === 0) {
            const sample = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
            console.log(`  Sample Faculty Dept: ${sample ? sample.department : 'NONE'}`);
        }
        if (studentCount === 0) {
            const sample = await prisma.student.findFirst();
            console.log(`  Sample Student Dept: ${sample ? (sample.department || sample.departmentId) : 'NONE'}`);
        }
    }
}

checkStats()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
