
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const sessionCount = await prisma.examSession.count();
        console.log("TOTAL SESSIONS:", sessionCount);

        const sessions = await prisma.examSession.findMany({
            include: {
                _count: { select: { allocations: true } },
                subjects: { include: { subject: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log("\nRECENT SESSIONS:");
        sessions.forEach(s => {
            console.log(`ID: ${s.id} | Name: ${s.examName} | Mode: ${s.examMode} | Allocations: ${s._count.allocations}`);
            console.log(`  Subjects: ${s.subjects.map(ss => `${ss.subject.code} (Sem ${ss.subject.semester}, Dept ${ss.subject.department})`).join(', ')}`);
        });

        const studentCount = await prisma.student.count();
        console.log("\nTOTAL STUDENTS IN DB:", studentCount);

        const departments = await prisma.student.groupBy({ by: ['department'] });
        console.log("UNIQUE STUDENT DEPARTMENTS:", departments.map(d => d.department));

        const semesters = await prisma.student.groupBy({ by: ['semester'] });
        console.log("UNIQUE STUDENT SEMESTERS:", semesters.map(s => s.semester));

        const sampleStudents = await prisma.student.findMany({ take: 10 });
        console.log("SAMPLE STUDENTS:");
        sampleStudents.forEach(s => {
            console.log(`Roll: ${s.rollNo} | Sem: ${s.semester} | Dept: '${s.department}'`);
        });

        const subDepts = await prisma.subject.groupBy({ by: ['department'] });
        console.log("UNIQUE SUBJECT DEPARTMENTS:", subDepts.map(d => d.department));

        const subSems = await prisma.subject.groupBy({ by: ['semester'] });
        console.log("UNIQUE SUBJECT SEMESTERS:", subSems.map(s => s.semester));

        const depts = await prisma.department.findMany();
        console.log("\nDEPARTMENT MODEL RECORDS:");
        depts.forEach(d => {
            console.log(`Name: '${d.name}' | Code: '${d.code}'`);
        });

        if (sessions.length > 0) {
            const latestSession = sessions[0];
            const subjectIds = latestSession.subjects.map(s => s.subjectId);
            const subjects = await prisma.subject.findMany({
                where: { id: { in: subjectIds } }
            });

            console.log("\nCHECKING ELIGIBILITY FOR LATEST SESSION (ID: " + latestSession.id + "):");
            for (const sub of subjects) {
                const count = await prisma.student.count({
                    where: {
                        department: sub.department || undefined,
                        semester: sub.semester
                    }
                });
                console.log(`Subject ${sub.code}: Sem ${sub.semester}, Dept '${sub.department}' -> Match Count: ${count}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
