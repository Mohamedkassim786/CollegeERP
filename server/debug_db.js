const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Latest 5 Students ---");
    const students = await prisma.student.findMany({
        orderBy: { id: 'desc' },
        take: 5,
        include: { sectionRef: true, departmentRef: true }
    });
    console.log(JSON.stringify(students, null, 2));

    console.log("\n--- Sections ---");
    const sections = await prisma.section.findMany({
        include: { department: true }
    });
    console.log(JSON.stringify(sections, null, 2));

    console.log("\n--- Departments ---");
    const depts = await prisma.department.findMany();
    console.log(JSON.stringify(depts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
