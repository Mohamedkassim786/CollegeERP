const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Fixing Badge Dept Data ---");

    // Get valid dept names
    const depts = await prisma.department.findMany();
    const codeToName = {};
    depts.forEach(d => {
        if (d.code) codeToName[d.code] = d.name;
    });

    // Get all students
    const students = await prisma.student.findMany({
        where: { year: { gt: 1 } }
    });

    let fixedCount = 0;
    for (const s of students) {
        if (codeToName[s.department]) {
            // It matches a code, check if it's strictly just the code (and name differs)
            // But wait, if s.department is "CSE", codeToName["CSE"] is "Computer Science".
            // Since "Computer Science" is not a key in codeToName (unless code is CS?), but usually keys are unique codes.
            // My check code was: if (!validNames.includes(s.department) && codeToName[s.department])

            const correctName = codeToName[s.department];
            if (correctName && s.department !== correctName) {
                console.log(`Fixing Student ${s.registerNumber}: "${s.department}" -> "${correctName}"`);
                await prisma.student.update({
                    where: { id: s.id },
                    data: { department: correctName }
                });
                fixedCount++;
            }
        }
    }

    console.log(`\nFixed ${fixedCount} students.`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
