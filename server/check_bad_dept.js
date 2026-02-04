const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Checking for Badge Dept Data ---");

    // Get valid dept names
    const depts = await prisma.department.findMany();
    const validNames = depts.map(d => d.name);
    const codeToName = {};
    depts.forEach(d => {
        if (d.code) codeToName[d.code] = d.name;
    });

    // Get all students
    const students = await prisma.student.findMany({
        where: { year: { gt: 1 } } // Only year 2+
    });

    let badCount = 0;
    for (const s of students) {
        if (!validNames.includes(s.department) && codeToName[s.department]) {
            console.log(`[Bad Data] Student: ${s.registerNumber}, Dept: "${s.department}" (Should be "${codeToName[s.department]}")`);
            badCount++;
        }
    }

    console.log(`\nFound ${badCount} students with Code instead of Name.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
