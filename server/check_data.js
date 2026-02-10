const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    log('--- Departments ---');
    const depts = await prisma.department.findMany();
    log(JSON.stringify(depts, null, 2));

    log('\n--- Faculty by Dept ---');
    const faculty = await prisma.user.groupBy({
        where: { role: 'FACULTY' },
        by: ['department'],
        _count: true
    });
    log(JSON.stringify(faculty, null, 2));

    log('\n--- Students by Dept ---');
    const students = await prisma.student.groupBy({
        by: ['department'],
        _count: true
    });
    log(JSON.stringify(students, null, 2));

    fs.writeFileSync('data_dump.json', output);
}

check().catch(console.error).finally(() => prisma.$disconnect());
