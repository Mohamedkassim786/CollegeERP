const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        const hods = await prisma.faculty.findMany({
            where: { role: 'HOD' },
            select: { id: true, fullName: true, department: true, isActive: true }
        });
        
        let output = '--- ALL HODS ---\n' + JSON.stringify(hods, null, 2) + '\n';

        const depts = await prisma.faculty.findMany({
            distinct: ['department'],
            select: { department: true }
        });
        
        output += '--- ALL DEPARTMENTS ---\n' + JSON.stringify(depts, null, 2) + '\n';
        
        fs.writeFileSync('scripts/test_flow/output.json', output);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
