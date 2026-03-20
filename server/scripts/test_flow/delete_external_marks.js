const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Initiating wipe of all external marks...');
  
  try {
    // 1. Delete all raw external marks submitted by external staff
    const extMarksMsg = await prisma.externalMark.deleteMany({});
    console.log(`Deleted ${extMarksMsg.count} rows from ExternalMark.`);

    // 2. Delete all processed end semester and final result marks
    const endSemMsg = await prisma.endSemMarks.deleteMany({});
    console.log(`Deleted ${endSemMsg.count} rows from EndSemMarks.`);

    // 3. Clear SemesterResult (Final GPA/CGPA calculations)
    // Optional, but if we delete end sem marks, the GPA/CGPA is now fully invalid.
    const resultMsg = await prisma.semesterResult.deleteMany({});
    console.log(`Deleted ${resultMsg.count} rows from SemesterResult.`);

    // 4. Reset Semester Controls so admin can re-publish or re-enter if they want
    const controlMsg = await prisma.semesterControl.updateMany({
      data: {
        isPublished: false,
        isFrozen: false
      }
    });
    console.log(`Reset isPublished/isFrozen on ${controlMsg.count} SemesterControl records.`);

  } catch (error) {
    console.error('Error during external marks cleanup:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Cleanup complete.');
  }
}

main();
