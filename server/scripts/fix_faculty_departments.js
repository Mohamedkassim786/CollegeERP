const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting faculty department normalization...");

    const result = await prisma.user.updateMany({
        where: {
            role: 'FACULTY',
            department: 'Computer Science'
        },
        data: {
            department: 'CSE'
        }
    });

    console.log(`Successfully updated ${result.count} faculty members from 'Computer Science' to 'CSE'.`);

    // Optional: Check if there are any other students or subjects with 'Computer Science'
    const studentResult = await prisma.student.updateMany({
        where: { department: 'Computer Science' },
        data: { department: 'CSE' }
    });
    if (studentResult.count > 0) {
        console.log(`Updated ${studentResult.count} students from 'Computer Science' to 'CSE'.`);
    }

    const subjectResult = await prisma.subject.updateMany({
        where: { department: 'Computer Science' },
        data: { department: 'CSE' }
    });
    if (subjectResult.count > 0) {
        console.log(`Updated ${subjectResult.count} subjects from 'Computer Science' to 'CSE'.`);
    }

    console.log("Normalization complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
