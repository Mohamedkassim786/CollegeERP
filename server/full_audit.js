const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function fullAudit() {
    let output = '=== FULL SYSTEM AUDIT ===\n\n';

    // 1. Students
    const students = await prisma.student.findMany();
    output += `TOTAL STUDENTS: ${students.length}\n`;
    students.forEach(s => {
        output += `- [${s.id}] Name: ${s.name} (${s.registerNumber}) | Dept: ${s.department} | Sem: ${s.semester} | Sec: ${s.section}\n`;
    });

    // 2. Subjects
    const subjects = await prisma.subject.findMany();
    output += `\nTOTAL SUBJECTS: ${subjects.length}\n`;
    subjects.forEach(sb => {
        output += `- [${sb.id}] Name: ${sb.name} (${sb.code}) | Dept: ${sb.department} | Sem: ${sb.semester} | Type: ${sb.type}\n`;
    });

    // 3. Assignments
    const assignments = await prisma.facultyAssignment.findMany({
        include: { subject: true }
    });
    output += `\nTOTAL ASSIGNMENTS: ${assignments.length}\n`;
    assignments.forEach(a => {
        output += `- [${a.id}] Faculty: ${a.facultyId} | Sub: ${a.subject.name} (Sem ${a.subject.semester}) | Sec: ${a.section}\n`;
    });

    fs.writeFileSync('audit_output.txt', output);
}

fullAudit().catch(console.error).finally(() => prisma.$disconnect());
