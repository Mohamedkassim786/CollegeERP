const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting data migration...");

    // 1. Ensure a default Academic Year exists
    let defaultAcademicYear = await prisma.academicYear.findFirst({
        where: { year: "2023-24" }
    });

    if (!defaultAcademicYear) {
        defaultAcademicYear = await prisma.academicYear.create({
            data: { year: "2023-24", isActive: true }
        });
        console.log("Created default Academic Year:", defaultAcademicYear.year);
    } else {
        await prisma.academicYear.update({
            where: { id: defaultAcademicYear.id },
            data: { isActive: true }
        });
    }

    // 2. Fetch all departments to map string -> id
    const departments = await prisma.department.findMany();
    const deptMap = {}; // { "Computer Science": 1, "CSE": 1 }
    departments.forEach(d => {
        if (d.name) deptMap[d.name.toLowerCase()] = d.id;
        if (d.code) deptMap[d.code.toLowerCase()] = d.id;
    });

    // 3. Migrate Students
    const students = await prisma.student.findMany();
    console.log(`Found ${students.length} students to migrate.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const s of students) {
        // Map department string to ID
        let deptId = null;
        if (s.department) {
            deptId = deptMap[s.department.toLowerCase()] || null;
        }

        if (!deptId) {
            console.warn(`Warning: Could not find department ID for student ${s.rollNo} (dept string: ${s.department})`);
        }

        // Determine Section Type
        const isFirstYear = s.semester <= 2;
        const type = isFirstYear ? "COMMON" : "DEPARTMENT";
        const sectionDeptId = isFirstYear ? null : deptId;

        // Find or Create Section
        let targetSection = null;
        if (s.section && s.semester) {
            targetSection = await prisma.section.findFirst({
                where: {
                    name: s.section,
                    semester: s.semester,
                    departmentId: sectionDeptId, // Null for common
                    academicYearId: defaultAcademicYear.id
                }
            });

            if (!targetSection) {
                targetSection = await prisma.section.create({
                    data: {
                        name: s.section,
                        semester: s.semester,
                        type: type,
                        departmentId: sectionDeptId,
                        academicYearId: defaultAcademicYear.id
                    }
                });
                console.log(`Created new ${type} Section: ${s.section} for Sem ${s.semester}${sectionDeptId ? ' (Dept ' + sectionDeptId + ')' : ' (Common)'}`);
            }
        }

        // Extract batch year
        let parsedBatchYear = null;
        if (s.batch) {
            const parts = s.batch.split('-');
            if (parts.length > 0 && !isNaN(parseInt(parts[0]))) {
                parsedBatchYear = parseInt(parts[0]);
            }
        }

        // Update Student
        try {
            await prisma.student.update({
                where: { id: s.id },
                data: {
                    departmentId: deptId,
                    sectionId: targetSection ? targetSection.id : null,
                    currentSemester: s.semester,
                    academicYearId: defaultAcademicYear.id,
                    batchYear: parsedBatchYear ? parsedBatchYear.toString() : null
                }
            });
            updatedCount++;
        } catch (err) {
            console.error(`Failed to update student ${s.rollNo}:`, err.message);
            skippedCount++;
        }
    }

    console.log(`Migration Complete! Updated: ${updatedCount}, Skipped: ${skippedCount}`);
}

main()
    .catch(e => {
        console.error("Migration failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
