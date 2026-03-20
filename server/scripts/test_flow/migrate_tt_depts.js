const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const all = await prisma.timetable.findMany();
    
    const uniqueDepts = [...new Set(all.map(t => t.department))];
    console.log("Unique departments in Timetable:", uniqueDepts);
    
    // Convert 'MECH' to 'Mechanical Engineering' just in case
    const updated = await prisma.timetable.updateMany({
        where: { department: 'MECH' },
        data: { department: 'Mechanical Engineering' }
    });
    
    console.log("Updated MECH -> Mechanical Engineering:", updated.count);
    
    // Also convert 'CSE' if any exist
    const updatedCse = await prisma.timetable.updateMany({
        where: { department: 'CSE' },
        data: { department: 'Computer Science and Engineering' }
    });
    console.log("Updated CSE -> Computer Science and Engineering:", updatedCse.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
