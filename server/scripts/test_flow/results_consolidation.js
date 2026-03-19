const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- External Marks and Result Consolidation ---');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const dummyMappings = await prisma.subjectDummyMapping.findMany();
  const subjects = await prisma.subject.findMany();
  const students = await prisma.student.findMany();

  // 1. Seed Grade Settings if empty
  const gradeCount = await prisma.gradeSettings.count();
  if (gradeCount === 0) {
    console.log('Seeding Grade Settings...');
    const grades = [
      { regulation: '2021', grade: 'O', minPercentage: 90, maxPercentage: 100, gradePoint: 10 },
      { regulation: '2021', grade: 'A+', minPercentage: 80, maxPercentage: 89, gradePoint: 9 },
      { regulation: '2021', grade: 'A', minPercentage: 70, maxPercentage: 79, gradePoint: 8 },
      { regulation: '2021', grade: 'B+', minPercentage: 60, maxPercentage: 69, gradePoint: 7 },
      { regulation: '2021', grade: 'B', minPercentage: 50, maxPercentage: 59, gradePoint: 6 },
      { regulation: '2021', grade: 'U', minPercentage: 0, maxPercentage: 49, gradePoint: 0, resultStatus: 'RA' },
    ];
    for (const g of grades) {
      await prisma.gradeSettings.create({ data: g });
    }
  }

  // 2. Enter External Marks
  console.log('Entering External Marks...');
  for (const mapping of dummyMappings) {
    const rawExternal = Math.floor(Math.random() * 60) + 40; // 40 to 100
    const converted = (rawExternal * 60) / 100;

    await prisma.externalMark.upsert({
      where: { 
        subjectId_dummyNumber_component: { 
          subjectId: mapping.subjectId, 
          dummyNumber: mapping.dummyNumber, 
          component: 'THEORY' 
        } 
      },
      update: { rawExternal100: rawExternal, convertedExternal60: converted, isApproved: true },
      create: {
        subjectId: mapping.subjectId,
        dummyNumber: mapping.dummyNumber,
        component: 'THEORY',
        rawExternal100: rawExternal,
        convertedExternal60: converted,
        submittedBy: admin ? admin.id : 1,
        isApproved: true,
        status: 'APPROVED'
      }
    });
  }
  console.log('✓ External marks entered and approved');

  // 3. Result Consolidation
  console.log('Consolidating Results...');
  const gradeSettings = await prisma.gradeSettings.findMany({ where: { regulation: '2021' } });

  for (const student of students) {
    const studentMarks = await prisma.marks.findMany({
      where: { studentId: student.id },
      include: { subject: true }
    });

    let totalEarnedCredits = 0;
    let totalPossibleCredits = 0;
    let totalGradePoints = 0;

    for (const m of studentMarks) {
      // Find external mark for this subject
      const mapping = await prisma.subjectDummyMapping.findUnique({
        where: { studentId_subjectId: { studentId: student.id, subjectId: m.subjectId } }
      });

      let extMarkVal = 0;
      if (mapping) {
        const extMark = await prisma.externalMark.findUnique({
          where: { 
            subjectId_dummyNumber_component: { 
              subjectId: m.subjectId, 
              dummyNumber: mapping.dummyNumber, 
              component: 'THEORY' 
            } 
          }
        });
        if (extMark) extMarkVal = extMark.convertedExternal60;
      } else if (m.subject.subjectCategory === 'LAB') {
        // Lab marks are usually internal + external lab, let's just simulate end sem 60
        extMarkVal = Math.floor(Math.random() * 40) + 20; 
      }

      const total = (m.internal || 0) + extMarkVal;
      const percentage = total; // Assuming internal(40) + external(60) = 100

      // Find grade
      const gradeObj = gradeSettings.sort((a,b) => b.minPercentage - a.minPercentage)
                        .find(g => percentage >= g.minPercentage);
      
      const grade = gradeObj ? gradeObj.grade : 'U';
      const gradePoint = gradeObj ? gradeObj.gradePoint : 0;
      const status = grade === 'U' ? 'RA' : 'PASS';

      await prisma.endSemMarks.upsert({
        where: { marksId: m.id },
        update: {
          externalMarks: extMarkVal,
          totalMarks: total,
          grade: grade,
          resultStatus: status,
          isPublished: true
        },
        create: {
          marksId: m.id,
          externalMarks: extMarkVal,
          totalMarks: total,
          grade: grade,
          resultStatus: status,
          isPublished: true
        }
      });

      if (status === 'PASS') {
        totalEarnedCredits += m.subject.credits;
        totalGradePoints += (gradePoint * m.subject.credits);
      }
      totalPossibleCredits += m.subject.credits;
    }

    const gpa = totalPossibleCredits > 0 ? totalGradePoints / totalPossibleCredits : 0;

    await prisma.semesterResult.upsert({
      where: { studentId_semester: { studentId: student.id, semester: student.semester } },
      update: {
        gpa: gpa,
        cgpa: gpa, // Simplified for test
        totalCredits: totalPossibleCredits,
        earnedCredits: totalEarnedCredits,
        resultStatus: totalEarnedCredits === totalPossibleCredits ? 'PASS' : 'FAIL'
      },
      create: {
        studentId: student.id,
        semester: student.semester,
        gpa: gpa,
        cgpa: gpa,
        totalCredits: totalPossibleCredits,
        earnedCredits: totalEarnedCredits,
        resultStatus: totalEarnedCredits === totalPossibleCredits ? 'PASS' : 'FAIL'
      }
    });
  }
  console.log('✓ Result consolidation complete');

  console.log('--- External Marks and Consolidation Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
