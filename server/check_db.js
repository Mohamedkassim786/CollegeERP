const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const subject = await prisma.subject.findUnique({ where: { code: 'CS3401' } });
    if (!subject) {
      console.log('Subject CS3401 not found');
      return;
    }
    console.log(`Subject: ${subject.name} (ID: ${subject.id})`);

    const mappings = await prisma.subjectDummyMapping.findMany({
      where: { subjectId: subject.id }
    });
    console.log(`\n--- SubjectDummyMapping (${mappings.length} records) ---`);
    mappings.forEach(m => {
      console.log(`Dummy: [${m.dummyNumber}], Marks: ${m.marks}, mappingLocked: ${m.mappingLocked}`);
    });

    const external = await prisma.externalMark.findMany({
      where: { subjectId: subject.id }
    });
    console.log(`\n--- ExternalMark (${external.length} records) ---`);
    external.forEach(em => {
      console.log(`Dummy: [${em.dummyNumber}], Component: ${em.component}, Marks: ${em.rawExternal100}`);
    });

    const endSem = await prisma.endSemMarks.findMany({
      where: { marks: { subjectId: subject.id } },
      include: { marks: true }
    });
    console.log(`\n--- EndSemMarks (${endSem.length} records) ---`);
    endSem.forEach(esm => {
      console.log(`MarksId: ${esm.marksId}, ExternalMarks: ${esm.externalMarks}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
