const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFaculty() {
    console.log('--- Verifying Faculty Student Fetching ---');

    // 1. Pick a faculty assignment
    const assignment = await prisma.facultyAssignment.findFirst({
        include: { subject: true }
    });

    if (!assignment) {
        console.log('No assignments found to test.');
        return;
    }

    console.log(`Testing with Faculty ID: ${assignment.facultyId}, Subject: ${assignment.subject.name}, Sec: ${assignment.section}`);

    // 2. Mock the controller logic
    const getDeptCriteria = (deptString) => {
        if (!deptString) return { in: [null, ''] };
        const trimmed = deptString.trim();
        if (trimmed === 'GEN' || trimmed === 'First Year (General)') {
            return { in: ['First Year (General)', 'GEN', null, ''] };
        }
        return { in: [trimmed] }; // Simplified for test since we know it's normalized or matched
    };

    const deptCriteria = getDeptCriteria(assignment.subject.department);

    const students = await prisma.student.findMany({
        where: {
            department: deptCriteria,
            semester: assignment.subject.semester,
            section: assignment.section
        }
    });

    console.log(`Found ${students.length} students.`);
    if (students.length > 0) {
        console.log('Sample student:', students[0].name, 'Dept:', students[0].department);
    } else {
        console.log('WARNING: Zero students found. Check if students exist for this semester/section.');
        // Debug student distribution
        const anyStudents = await prisma.student.findMany({ take: 5 });
        console.log('Total students in DB:', await prisma.student.count());
        console.log('Sample students:', anyStudents.map(s => ({ name: s.name, dept: s.department, sem: s.semester, sec: s.section })));
    }
}

verifyFaculty().catch(console.error).finally(() => prisma.$disconnect());
