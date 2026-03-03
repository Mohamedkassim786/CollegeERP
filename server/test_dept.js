const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const department = "Computer Science";
    const deptObj = await prisma.department.findFirst({
        where: {
            OR: [
                { name: department },
                { code: department }
            ]
        }
    });

    console.log(`Searching for "${department}":`, deptObj ? "FOUND (ID: " + deptObj.id + ")" : "NOT FOUND");

    const departmentUpper = "COMPUTER SCIENCE";
    const deptObjUpper = await prisma.department.findFirst({
        where: {
            OR: [
                { name: departmentUpper },
                { code: departmentUpper }
            ]
        }
    });
    console.log(`Searching for "${departmentUpper}":`, deptObjUpper ? "FOUND (ID: " + deptObjUpper.id + ")" : "NOT FOUND");
}

test().catch(console.error).finally(() => prisma.$disconnect());
