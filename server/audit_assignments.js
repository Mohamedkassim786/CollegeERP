const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    console.log('--- Detailed Faculty Student Audit ---');

    const assignments = await prisma.facultyAssignment.findMany({
        include: { subject: true }
    });

    console.log(`Checking ${assignments.length} assignments...`);

    for (const a of assignments) {
        const s = a.subject;
        console.log(`\nAssignment ID: ${a.id}`);
        console.log(`Faculty ID: ${a.facultyId}`);
        console.log(`Subject: ${s.name} (ID: ${s.id}, Dept: "${s.department}", Sem: ${s.semester})`);
        console.log(`Assigned Section: "${a.section}"`);

        // Mock getDeptCriteria
        let deptCriteria;
        if (!s.department) {
            deptCriteria = { in: ['First Year (General)', 'GEN', null, ''] };
        } else {
            const d = s.department.trim();
            if (d === 'GEN' || d === 'First Year (General)') {
                deptCriteria = { in: ['First Year (General)', 'GEN', null, ''] };
            } else {
                deptCriteria = { in: [d] };
            }
        }

        const matchingStudents = await prisma.student.count({
            where: {
                department: deptCriteria,
                semester: s.semester,
                section: a.section
            }
        });

        console.log(`Matching Students: ${matchingStudents}`);

        if (matchingStudents === 0) {
            // Find why
            const byDept = await prisma.student.count({ where: { department: deptCriteria } });
            const bySem = await prisma.student.count({ where: { semester: s.semester } });
            const bySec = await prisma.student.count({ where: { section: a.section } });
            const byDeptSem = await prisma.student.count({ where: { department: deptCriteria, semester: s.semester } });

            console.log(`- Students in Dept ${JSON.stringify(deptCriteria)}: ${byDept}`);
            console.log(`- Students in Semester ${s.semester}: ${bySem}`);
            console.log(`- Students in Section ${a.section}: ${bySec}`);
            console.log(`- Students in Dept+Sem: ${byDeptSem}`);
        }
    }
}

audit().catch(console.error).finally(() => prisma.$disconnect());
