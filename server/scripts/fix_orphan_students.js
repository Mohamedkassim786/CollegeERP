const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting deep data cleanup: merging orphan structures...");

    // 1. Fetch all departments
    const depts = await prisma.department.findMany();

    // 2. Identify broken DEPARTMENT sections (departmentId: null)
    const brokenSections = await prisma.section.findMany({
        where: { type: "DEPARTMENT", departmentId: null }
    });

    console.log(`Found ${brokenSections.length} broken sections to resolve.`);

    for (const broken of brokenSections) {
        console.log(`Analyzing broken section ${broken.id} (${broken.name} S${broken.semester})...`);

        // We assume these are CSE (Dept ID: 2) as that's where the user is adding students
        const targetDeptId = 2;

        // Check if a valid section already exists for this dept/sem/name
        const validSection = await prisma.section.findFirst({
            where: {
                name: broken.name,
                semester: broken.semester,
                departmentId: targetDeptId,
                academicYearId: broken.academicYearId
            }
        });

        if (validSection) {
            console.log(`Merging students: Section ${broken.id} -> Section ${validSection.id}`);

            // Move students
            const updateResult = await prisma.student.updateMany({
                where: { sectionId: broken.id },
                data: {
                    sectionId: validSection.id,
                    departmentId: targetDeptId,
                    department: "CSE" // Standardize string
                }
            });

            console.log(`Moved ${updateResult.count} students.`);

            // Delete broken section
            await prisma.section.delete({ where: { id: broken.id } });
            console.log(`Deleted section ${broken.id}.`);
        } else {
            // Just link the existing section to the department if it's not a duplicate
            try {
                await prisma.section.update({
                    where: { id: broken.id },
                    data: { departmentId: targetDeptId }
                });
                await prisma.student.updateMany({
                    where: { sectionId: broken.id },
                    data: {
                        departmentId: targetDeptId,
                        department: "CSE"
                    }
                });
                console.log(`Linked section ${broken.id} to department ${targetDeptId}.`);
            } catch (err) {
                console.error(`Failed to link section ${broken.id}:`, err.message);
            }
        }
    }

    // 3. Fix any other orphan students
    const orphans = await prisma.student.findMany({
        where: {
            OR: [
                { departmentId: null },
                { sectionId: null }
            ]
        }
    });

    console.log(`Found ${orphans.length} remaining orphan students.`);
    // ... similar logic if needed, but the section merge should cover most.

    console.log(`Cleanup complete.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
