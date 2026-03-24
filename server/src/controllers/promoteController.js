const prisma = require('../lib/prisma');
const { logger } = require('../utils/logger');
const { handleError } = require('../utils/errorUtils');

/**
 * POST /api/admin/promote-global
 * Executes massive global promotion for all active students not in Semester 2.
 * Enforces strict locking checks across all active cohorts.
 */
exports.executeGlobalPromotion = async (req, res) => {
    try {
        // Fetch all active students NOT in Semester 2
        // Sem 1 -> Sem 2 is standard
        // Sem 2 -> Sem 3 requires manual branching
        const students = await prisma.student.findMany({
            where: {
                status: 'ACTIVE',
                semester: { not: 2 }
            }
        });

        if (!students.length) {
            return res.status(400).json({ message: 'No active eligible students found for global promotion.' });
        }

        // 2. Extract unique combinations of cohorts to check for locks
        const activeCohorts = new Map();
        for (const s of students) {
            // Only group by department, year, semester (section locking often spans the whole semester but we group explicitly)
            const key = `${s.department}|${s.year}|${s.semester}|${s.section}`;
            if (!activeCohorts.has(key)) {
                activeCohorts.set(key, {
                    department: s.department,
                    year: s.year,
                    semester: s.semester,
                    section: s.section
                });
            }
        }

        // 3. Strict Lock Validation Check
        const unlockedCohorts = [];

        // Fetch departments for accurate name to code mapping in the UI
        const depts = await prisma.department.findMany({ select: { name: true, code: true } });
        const deptMap = {};
        for (const d of depts) {
            if (d.name) deptMap[d.name] = d.code || d.name;
        }

        for (const cohort of activeCohorts.values()) {
            if (!cohort.department) continue; // safety for misconfigured students

            const control = await prisma.semesterControl.findFirst({
                where: {
                    department: cohort.department,
                    year: cohort.year,
                    semester: cohort.semester,
                    section: cohort.section
                }
            });

            if (!control || !control.isLocked) {
                const uiDept = deptMap[cohort.department] || cohort.department;
                unlockedCohorts.push(`${uiDept} Year ${cohort.year} Sem ${cohort.semester} Sec ${cohort.section}`);
            }
        }

        if (unlockedCohorts.length > 0) {
            return res.status(400).json({
                message: 'Global promotion aborted. One or more active cohorts are not locked.',
                unlockedCohorts
            });
        }

        // 4. Execution Step
        let promoted = 0, graduated = 0;

        for (const student of students) {
            if (student.semester === 8) {
                // Graduate them
                await prisma.student.update({
                    where: { id: student.id },
                    data: { status: 'PASSED_OUT' }
                });
                graduated++;
            } else {
                // Advance them
                const nextSemester = student.semester + 1;
                const nextYear = Math.ceil(nextSemester / 2);
                let targetSecId = student.sectionId;

                // Resolve new section
                if (student.section && student.departmentId) {
                    const newSection = await prisma.section.findFirst({
                        where: {
                            name: student.section,
                            semester: nextSemester,
                            departmentId: student.departmentId,
                            academicYearId: student.academicYearId || 1
                        }
                    });

                    if (newSection) {
                        targetSecId = newSection.id;
                    } else {
                        const createdSec = await prisma.section.create({
                            data: {
                                name: student.section,
                                semester: nextSemester,
                                type: "DEPARTMENT",
                                departmentId: student.departmentId,
                                academicYearId: student.academicYearId || 1
                            }
                        });
                        targetSecId = createdSec.id;
                    }
                }

                await prisma.student.update({
                    where: { id: student.id },
                    data: {
                        semester: nextSemester,
                        currentSemester: nextSemester,
                        year: nextYear,
                        sectionId: targetSecId
                    }
                });
                promoted++;
            }
        }

        logger.info(`Global Promote: ${promoted} promoted, ${graduated} graduated.`);
        res.json({
            message: `Global Promotion complete! ${promoted} students successfully advanced to the next semester. ${graduated} final year students marked as Passed Out.`,
            promoted,
            graduated
        });

    } catch (error) {
        handleError(res, error, "Failed to execute global promotion");
    }
};

/**
 * POST /api/admin/promote-first-years
 * Body: { assignments: [{ studentId: 1, departmentCode: 'CSE', departmentId: 4, section: 'A' }, ...] }
 */
exports.promoteFirstYears = async (req, res) => {
    try {
        const { assignments } = req.body;
        if (!assignments || !assignments.length) {
            return res.status(400).json({ message: 'No student branching assignments provided.' });
        }

        // --- FIRST YEAR LOCK VALIDATION ---
        const studentIds = assignments.map(a => a.studentId);
        const studentsToPromote = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, department: true, year: true, semester: true, section: true }
        });

        const activeCohorts = new Map();
        for (const s of studentsToPromote) {
            if (!s.department || !s.section) continue;
            const key = `${s.department}|${s.year}|${s.semester}|${s.section}`;
            if (!activeCohorts.has(key)) {
                activeCohorts.set(key, { department: s.department, year: s.year, semester: s.semester, section: s.section });
            }
        }

        const unlockedCohorts = [];
        const depts = await prisma.department.findMany({ select: { name: true, code: true } });
        const deptMap = {};
        for (const d of depts) {
            if (d.name) deptMap[d.name] = d.code || d.name;
        }

        for (const cohort of activeCohorts.values()) {
            const control = await prisma.semesterControl.findFirst({
                where: {
                    department: cohort.department,
                    year: cohort.year,
                    semester: cohort.semester,
                    section: cohort.section
                }
            });

            if (!control || !control.isLocked) {
                const uiDept = deptMap[cohort.department] || cohort.department;
                unlockedCohorts.push(`${uiDept} Sem ${cohort.semester} Sec ${cohort.section}`);
            }
        }

        if (unlockedCohorts.length > 0) {
            return res.status(400).json({
                message: `Branching Aborted! The following source cohorts are NOT locked by the examination controller: ${unlockedCohorts.join(', ')}`
            });
        }
        // --- END VALIDATION ---

        let promoted = 0;

        for (const item of assignments) {
            const nextSemester = 3;
            const nextYear = 2;

            // Find or create the target section in target department
            const newSection = await prisma.section.findFirst({
                where: {
                    name: item.section,
                    semester: nextSemester,
                    departmentId: item.departmentId
                }
            });

            let targetSecId;
            if (newSection) {
                targetSecId = newSection.id;
            } else {
                // Need an academicYearId. Will grab from the student.
                const st = await prisma.student.findUnique({ where: { id: item.studentId } });
                const createdSec = await prisma.section.create({
                    data: {
                        name: item.section,
                        semester: nextSemester,
                        type: "DEPARTMENT",
                        departmentId: item.departmentId,
                        academicYearId: st.academicYearId || 1
                    }
                });
                targetSecId = createdSec.id;
            }

            await prisma.student.update({
                where: { id: item.studentId },
                data: {
                    semester: nextSemester,
                    currentSemester: nextSemester,
                    year: nextYear,
                    section: item.section,
                    sectionId: targetSecId,
                    department: item.departmentCode,
                    departmentId: item.departmentId
                }
            });
            promoted++;
        }

        logger.info(`First Year Promotion: ${promoted} branching into departments.`);
        res.json({ message: `${promoted} First Year students successfully promoted and allocated to core departments.` });

    } catch (error) {
        handleError(res, error, "Failed to execute first year branching");
    }
};

/**
 * GET /api/admin/promote-preview
 * Pre-computes the metrics for the promotion UI.
 * Returns global summary or first year summary based on query mode.
 */
exports.promotePreview = async (req, res) => {
    try {
        const { mode } = req.query; // 'GLOBAL' or 'FIRST_YEAR'
        
        if (mode === 'GLOBAL') {
            const students = await prisma.student.findMany({
                where: { status: 'ACTIVE', semester: { not: 2 } },
                select: { id: true, semester: true }
            });
            
            const totalPromoting = students.filter(s => s.semester < 8).length;
            const totalGraduating = students.filter(s => s.semester === 8).length;
            
            return res.json({ totalPromoting, totalGraduating, totalStudents: students.length });
        } 
        
        if (mode === 'FIRST_YEAR') {
            const students = await prisma.student.findMany({
                where: { status: 'ACTIVE', semester: 2 },
                select: { id: true, rollNo: true, name: true, department: true, departmentId: true, section: true },
                orderBy: { rollNo: 'asc' }
            });
            
            return res.json({ students, totalStudents: students.length });
        }

        res.status(400).json({ message: "Invalid preview mode" });
    } catch (error) {
        handleError(res, error, "Failed to generate promotion preview");
    }
};
