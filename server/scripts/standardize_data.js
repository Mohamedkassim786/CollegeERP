const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function standardize() {
    try {
        const departments = await prisma.department.findMany();
        const codeToName = {};
        departments.forEach(d => {
            if (d.code) codeToName[d.code] = d.name;
        });

        console.log('Mapping:', JSON.stringify(codeToName, null, 2));

        // Update Subjects
        const subjects = await prisma.subject.findMany();
        let subCount = 0;
        for (const s of subjects) {
            if (codeToName[s.department]) {
                await prisma.subject.update({
                    where: { id: s.id },
                    data: { department: codeToName[s.department] }
                });
                subCount++;
            }
        }
        console.log(`Updated ${subCount} subjects to use names.`);

        // Update Students
        const students = await prisma.student.findMany();
        let stuCount = 0;
        for (const s of students) {
            if (codeToName[s.department]) {
                await prisma.student.update({
                    where: { id: s.id },
                    data: { department: codeToName[s.department] }
                });
                stuCount++;
            }
        }
        console.log(`Updated ${stuCount} students to use names.`);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

standardize();
