const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function normalize() {
    console.log('--- Starting Data Normalization ---');

    // 1. Get and Trim Departments
    const depts = await prisma.department.findMany();
    const codeToName = {};

    for (const dept of depts) {
        const trimmedName = dept.name.trim();
        const trimmedCode = dept.code ? dept.code.trim() : null;

        if (dept.name !== trimmedName || dept.code !== trimmedCode) {
            console.log(`Trimming Dept [${dept.id}]: "${dept.name}" -> "${trimmedName}", Code: "${dept.code}" -> "${trimmedCode}"`);
            await prisma.department.update({
                where: { id: dept.id },
                data: { name: trimmedName, code: trimmedCode }
            });
        }
        if (trimmedCode) {
            codeToName[trimmedCode.toUpperCase()] = trimmedName;
        }
        // Also map name to itself for consistency during lookup
        codeToName[trimmedName.toUpperCase()] = trimmedName;
    }

    // 2. Normalize Students
    const students = await prisma.student.findMany();
    let studentCount = 0;
    for (const s of students) {
        if (!s.department) continue;
        const upperDept = s.department.trim().toUpperCase();
        const correctName = codeToName[upperDept];

        if (correctName && s.department !== correctName) {
            console.log(`Normalizing Student ${s.registerNumber}: "${s.department}" -> "${correctName}"`);
            await prisma.student.update({
                where: { id: s.id },
                data: { department: correctName }
            });
            studentCount++;
        }
    }

    // 3. Normalize Users (Faculty)
    const users = await prisma.user.findMany({ where: { role: 'FACULTY' } });
    let facultyCount = 0;
    for (const u of users) {
        if (!u.department) continue;
        const upperDept = u.department.trim().toUpperCase();
        const correctName = codeToName[upperDept];

        if (correctName && u.department !== correctName) {
            console.log(`Normalizing Faculty ${u.username}: "${u.department}" -> "${correctName}"`);
            await prisma.user.update({
                where: { id: u.id },
                data: { department: correctName }
            });
            facultyCount++;
        }
    }

    console.log(`\nNormalization Complete!`);
    console.log(`Students updated: ${studentCount}`);
    console.log(`Faculty updated: ${facultyCount}`);
}

normalize().catch(console.error).finally(() => prisma.$disconnect());
