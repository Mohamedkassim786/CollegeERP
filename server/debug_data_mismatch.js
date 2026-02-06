const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFacultyView() {
    console.log("--- DEBUG START ---");
    const faculty = await prisma.user.findFirst({
        where: { fullName: { contains: 'Narayanan' } }
    });

    if (!faculty) { console.log("Faculty not found"); return; }
    console.log(`Faculty: ${faculty.fullName}`);

    const assignments = await prisma.facultyAssignment.findMany({
        where: { facultyId: faculty.id },
        include: { subject: true }
    });

    for (const a of assignments) {
        console.log(`\n[Subject: ${a.subject.name}]`);
        console.log(`  Target: Sem=${a.subject.semester}, Sec="${a.section}"`);

        // Check students in this Semester
        const students = await prisma.student.findMany({
            where: { semester: a.subject.semester },
            select: { section: true, department: true }
        });

        console.log(`  -> Found ${students.length} students in Sem ${a.subject.semester}.`);

        // Group by section
        const secCounts = {};
        students.forEach(s => {
            const key = `"${s.section}"`; // Wrap in quotes to see spaces
            secCounts[key] = (secCounts[key] || 0) + 1;
        });
        console.log("  -> Sections:", JSON.stringify(secCounts));

        // Group by Dept
        const deptCounts = {};
        students.forEach(s => {
            const key = `"${s.department}"`;
            deptCounts[key] = (deptCounts[key] || 0) + 1;
        });
        console.log("  -> Depts:", JSON.stringify(deptCounts));
    }
}

debugFacultyView().catch(console.error).finally(() => prisma.$disconnect());
