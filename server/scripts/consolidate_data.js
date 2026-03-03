const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting master data consolidation...");

    const SOURCE_AY_ID = 2; // "2023-24"
    const TARGET_AY_ID = 1; // "2023-2024"

    // 1. Fetch all sections in Source Academic Year
    const sourceSections = await prisma.section.findMany({
        where: { academicYearId: SOURCE_AY_ID }
    });

    console.log(`Found ${sourceSections.length} sections in Source Academic Year (${SOURCE_AY_ID}).`);

    for (const srcSec of sourceSections) {
        console.log(`Processing Section: ${srcSec.name} Sem: ${srcSec.semester} Dept: ${srcSec.departmentId}`);

        // Check if a matching section exists in Target Academic Year
        const targetSec = await prisma.section.findFirst({
            where: {
                name: srcSec.name,
                semester: srcSec.semester,
                departmentId: srcSec.departmentId,
                academicYearId: TARGET_AY_ID,
                type: srcSec.type
            }
        });

        if (targetSec) {
            console.log(`  Matching section found (ID: ${targetSec.id}). Moving students...`);

            // Move students from source section to target section
            const studentUpdate = await prisma.student.updateMany({
                where: { sectionId: srcSec.id },
                data: {
                    sectionId: targetSec.id,
                    academicYearId: TARGET_AY_ID
                }
            });
            console.log(`  Moved ${studentUpdate.count} students.`);

            // Delete the now-empty source section
            await prisma.section.delete({ where: { id: srcSec.id } });
            console.log(`  Deleted duplicate source section ${srcSec.id}.`);
        } else {
            console.log(`  No matching section in Target AY. Moving section ${srcSec.id} to Target AY.`);

            // Move the section itself to the target academic year
            await prisma.section.update({
                where: { id: srcSec.id },
                data: { academicYearId: TARGET_AY_ID }
            });

            // Also update students linked to this section
            const studentUpdate = await prisma.student.updateMany({
                where: { sectionId: srcSec.id },
                data: { academicYearId: TARGET_AY_ID }
            });
            console.log(`  Updated ${studentUpdate.count} students for moved section.`);
        }
    }

    // 2. Final Sweep: Move any students still linked to Source AY (e.g. orphans not in sections)
    const remainingStudents = await prisma.student.updateMany({
        where: { academicYearId: SOURCE_AY_ID },
        data: { academicYearId: TARGET_AY_ID }
    });
    console.log(`Moved ${remainingStudents.count} remaining students to Target AY.`);

    // 3. Delete the Source Academic Year
    await prisma.academicYear.delete({ where: { id: SOURCE_AY_ID } });
    console.log(`Deleted Source Academic Year ${SOURCE_AY_ID}.`);

    // 4. Ensure TARGET_AY is active
    await prisma.academicYear.update({
        where: { id: TARGET_AY_ID },
        data: { isActive: true }
    });

    console.log("Master data consolidation complete.");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
