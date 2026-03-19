/**
 * Auto Promote All — adminController supplement
 * POST /api/admin/promote-all
 * Promotes all ACTIVE students by incrementing their semester and year.
 * Only runs if semester is locked (semester control isLocked = true).
 * Use with extreme caution — admin only.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logger } = require('../utils/logger');

/**
 * POST /api/admin/promote-all
 * Body: { department, year, semester, section, regulation }
 * Promotes students to next semester. If semester 8 → marks as PASSED_OUT.
 */
exports.promoteAll = async (req, res) => {
    try {
        const { department, year, semester, section } = req.body;
        const semInt = parseInt(semester);
        const yearInt = parseInt(year);

        if (!department || !semester) {
            return res.status(400).json({ message: 'department and semester are required' });
        }

        // Build base where clause for students and controls
        let whereClause = {
            semester: semInt,
            ...(section ? { section } : {})
        };

        if (department === 'FIRST_YEAR') {
            whereClause.year = 1;
        } else {
            whereClause.department = department;
            whereClause.year = yearInt;
        }

        // Safety check: ensure semester control is locked before promoting
        // For first year, we might need a general 'FIRST_YEAR' or null department semester control record
        // Assuming controls are still mapped to department, we check by the strict criteria.
        // If FIRST_YEAR is used as a global, this might need further adaptation depending on how controls are logged.
        const control = await prisma.semesterControl.findFirst({
            where: whereClause
        });

        if (!control?.isLocked) {
            return res.status(400).json({
                message: 'Cannot promote: semester marks are not locked. Lock marks first.'
            });
        }

        const students = await prisma.student.findMany({
            where: {
                ...whereClause,
                status: 'ACTIVE'
            }
        });

        if (!students.length) {
            return res.status(400).json({ message: 'No active students found for the given filters.' });
        }

        const nextSemester = semInt + 1;
        const isGraduating = semInt === 8;

        let promoted = 0, graduated = 0;

        for (const student of students) {
            if (isGraduating) {
                await prisma.student.update({
                    where: { id: student.id },
                    data: { status: 'PASSED_OUT' }
                });
                graduated++;
            } else {
                await prisma.student.update({
                    where: { id: student.id },
                    data: {
                        semester: nextSemester,
                        currentSemester: nextSemester,
                        // Year advances every 2 semesters
                        year: Math.ceil(nextSemester / 2)
                    }
                });
                promoted++;
            }
        }

        logger.info(`Promote All: ${promoted} promoted, ${graduated} graduated in ${department} Sem ${semInt}`);
        res.json({
            message: `Promotion complete. ${promoted} students promoted to Sem ${nextSemester}. ${graduated} students marked as Passed Out.`,
            promoted,
            graduated
        });
    } catch (error) {
        logger.error('promoteAll failed', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/admin/promote-preview?department=CSE&year=2&semester=4
 * Preview which students will be promoted (without actually doing it).
 */
exports.promotePreview = async (req, res) => {
    try {
        const { department, year, semester, section } = req.query;

        // Build base where clause
        let whereClause = {
            semester: parseInt(semester),
            status: 'ACTIVE'
        };

        if (section) whereClause.section = section;

        // Handle FIRST_YEAR pseudo-department natively
        if (department === 'FIRST_YEAR') {
            whereClause.year = 1;
            // No strict department string match for first years as it might be varied (CSE, ECE) or null
        } else {
            whereClause.department = department;
            whereClause.year = parseInt(year);
        }

        const students = await prisma.student.findMany({
            where: whereClause,
            select: {
                id: true, rollNo: true, name: true, section: true, semester: true
            },
            orderBy: { rollNo: 'asc' }
        });

        res.json({
            totalStudents: students.length,
            nextSemester: parseInt(semester) + 1,
            isGraduating: parseInt(semester) === 8,
            students
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
