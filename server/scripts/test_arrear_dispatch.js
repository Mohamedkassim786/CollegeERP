const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    const studentId = 4; // ASI
    const subjectId = 6;  // Fluid Mechanics (Sem 4)
    
    console.log('Creating Arrear and ArrearAttempt...');
    
    const arrear = await prisma.arrear.create({
        data: {
            studentId,
            subjectId,
            semester: 4 // Fluid Mechanics is Sem 4
        }
    });
    
    const attempt = await prisma.arrearAttempt.create({
        data: {
            arrearId: arrear.id,
            semester: 5, // Attempting while in Sem 5
            resultStatus: null // Active attempt
        }
    });
    
    console.log('Test data created. ID:', arrear.id);
    
    // Now simulate calling the dispatch API logic
    const { getStudentsForDispatch } = require('../src/controllers/dispatchController');
    const req = { query: { subjectId: String(subjectId), semester: '4' } };
    const res = {
        status: () => res,
        json: (data) => {
            const found = data.find(s => s.id === studentId);
            if (found) {
                console.log('SUCCESS: Student found in dispatch!');
                console.log('Student Info:', JSON.stringify(found, null, 2));
            } else {
                console.log('FAILURE: Student NOT found in dispatch.');
            }
        }
    };
    
    await getStudentsForDispatch(req, res);
    
    // Cleanup
    console.log('Cleaning up...');
    await prisma.arrearAttempt.delete({ where: { id: attempt.id } });
    await prisma.arrear.delete({ where: { id: arrear.id } });
    console.log('Done.');
}

runTest().catch(console.error);
