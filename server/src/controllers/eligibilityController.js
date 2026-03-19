const prisma = require('../lib/prisma');
const { logger } = require('../utils/logger');
const { ELIGIBILITY_STATUS, ATTENDANCE_THRESHOLDS } = require('../utils/constants');
const { handleError } = require('../utils/errorUtils');

/**
 * GET /api/eligibility
 * Calculate and return eligibility for all students in a dept/semester/section.
 * Does NOT lock yet — just computes and stores current state.
 */
exports.getEligibility = async (req, res) => {
    try {
        const { department, semester, section, year } = req.query;
        if (!semester) {
            return res.status(400).json({ message: 'semester is required' });
        }

        const semInt = parseInt(semester);
        const isYear1 = semInt <= 2;

        if (!isYear1 && !department && department !== 'FIRST_YEAR') {
            return res.status(400).json({ message: 'department is required' });
        }

        const deptFilter = (isYear1 || department === 'FIRST_YEAR') ? {} : {
            OR: [
                { department: department },
                { departmentRef: { code: department } },
                { departmentRef: { name: department } }
            ]
        };

        // Fetch students - improved filtering to handle both department code and name
        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: semInt,
                ...(section ? { section } : {}),
                ...(year ? { year: parseInt(year) } : {}),
                status: 'ACTIVE'
            },
            include: {
                attendance: {
                    include: { subject: { select: { id: true, code: true, name: true, credits: true } } }
                },
                eligibility: {
                    where: { semester: semInt }
                }
            },
            orderBy: { rollNo: 'asc' }
        });

        // Get subjects for this semester/dept
        const subjectDeptFilter = (isYear1 || department === 'FIRST_YEAR') ? {
            OR: [ {type: 'COMMON'}, { semester: semInt } ]
        } : {
            OR: [
                { department: department },
                { type: 'COMMON' }
            ]
        };

        const subjects = await prisma.subject.findMany({
            where: {
                ...subjectDeptFilter,
                semester: semInt
            }
        });
        const result = students.map(student => {
            const subjectEligibility = subjects.map(subject => {
                const subAttendance = student.attendance.filter(a => a.subjectId === subject.id);
                const total   = subAttendance.length;
                const present = subAttendance.filter(a =>
                    a.status === 'PRESENT' || a.status === 'OD'
                ).length;
                const percent = total > 0 ? Math.round((present / total) * 100 * 100) / 100 : 0;

                let status;
                if (percent >= ATTENDANCE_THRESHOLDS.ELIGIBLE) {
                    status = ELIGIBILITY_STATUS.ELIGIBLE;
                } else if (percent >= ATTENDANCE_THRESHOLDS.CONDONATION_MIN) {
                    status = ELIGIBILITY_STATUS.CONDONATION;
                } else {
                    status = ELIGIBILITY_STATUS.DETAINED;
                }

                // Check if exception was granted
                const existingRecord = student.eligibility.find(e => e.subjectId === subject.id);

                return {
                    subjectId: subject.id,
                    subjectCode: subject.code,
                    subjectName: subject.name,
                    credits: subject.credits,
                    totalClasses: total,
                    present,
                    percent,
                    status,
                    isException: existingRecord?.isException || false,
                    exceptionReason: existingRecord?.exceptionReason || null,
                    isLocked: existingRecord?.isLocked || false,
                    eligibilityId: existingRecord?.id || null
                };
            });

            // Overall: detained if ANY subject is DETAINED (without exception)
            const isOverallDetained = subjectEligibility.some(
                s => s.status === ELIGIBILITY_STATUS.DETAINED && !s.isException
            );

            return {
                studentId: student.id,
                rollNo: student.rollNo,
                registerNumber: student.registerNumber,
                name: student.name,
                section: student.section,
                subjects: subjectEligibility,
                overallStatus: isOverallDetained ? ELIGIBILITY_STATUS.DETAINED : ELIGIBILITY_STATUS.ELIGIBLE
            };
        });

        res.json({ data: result, totalStudents: students.length });
    } catch (error) {
        handleError(res, error, "Failed to get eligibility status");
    }
};

/**
 * POST /api/eligibility/calculate
 * Calculate and persist eligibility records to DB for a semester.
 */
exports.calculateAndSave = async (req, res) => {
    try {
        const { department, semester, section, year } = req.body;
        if (!semester) {
            return res.status(400).json({ message: 'semester is required' });
        }

        const semInt = parseInt(semester);
        const isYear1 = semInt <= 2;

        if (!isYear1 && !department && department !== 'FIRST_YEAR') {
            return res.status(400).json({ message: 'department is required' });
        }

        const deptFilter = (isYear1 || department === 'FIRST_YEAR') ? {} : {
            OR: [
                { department: department },
                { departmentRef: { code: department } },
                { departmentRef: { name: department } }
            ]
        };

        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: semInt,
                ...(section ? { section } : {}),
                ...(year ? { year: parseInt(year) } : {}),
                status: 'ACTIVE'
            },
            include: { attendance: true }
        });

        const subjectDeptFilter = (isYear1 || department === 'FIRST_YEAR') ? {
            OR: [ {type: 'COMMON'}, { semester: semInt } ]
        } : {
            OR: [
                { department: department },
                { type: 'COMMON' }
            ]
        };

        const subjects = await prisma.subject.findMany({
            where: {
                ...subjectDeptFilter,
                semester: semInt
            }
        });

        let upsertCount = 0;
        for (const student of students) {
            for (const subject of subjects) {
                const subAttendance = student.attendance.filter(a => a.subjectId === subject.id);
                const total   = subAttendance.length;
                const present = subAttendance.filter(a =>
                    a.status === 'PRESENT' || a.status === 'OD'
                ).length;
                const percent = total > 0 ? Math.round((present / total) * 10000) / 100 : 0;

                let status;
                if (percent >= ATTENDANCE_THRESHOLDS.ELIGIBLE) {
                    status = ELIGIBILITY_STATUS.ELIGIBLE;
                } else if (percent >= ATTENDANCE_THRESHOLDS.CONDONATION_MIN) {
                    status = ELIGIBILITY_STATUS.CONDONATION;
                } else {
                    status = ELIGIBILITY_STATUS.DETAINED;
                }

                // Only upsert if not locked
                const existing = await prisma.attendanceEligibility.findUnique({
                    where: { studentId_subjectId_semester: { studentId: student.id, subjectId: subject.id, semester: semInt } }
                });

                if (existing?.isLocked) continue; // Don't overwrite locked records

                await prisma.attendanceEligibility.upsert({
                    where: { studentId_subjectId_semester: { studentId: student.id, subjectId: subject.id, semester: semInt } },
                    update: { attendancePercent: percent, status },
                    create: { studentId: student.id, subjectId: subject.id, semester: semInt, attendancePercent: percent, status }
                });
                upsertCount++;
            }
        }

        res.json({ message: `Eligibility calculated for ${students.length} students.`, upsertCount });
    } catch (error) {
        handleError(res, error, "Failed to calculate and save eligibility");
    }
};

/**
 * POST /api/eligibility/exception
 * Grant or reject a condonation exception for a specific student+subject.
 */
exports.grantException = async (req, res) => {
    try {
        const { eligibilityId, studentId, subjectId, semester, reason, grant } = req.body;
        const grantedBy = req.user.id;

        let record;
        if (eligibilityId) {
            record = await prisma.attendanceEligibility.update({
                where: { id: eligibilityId },
                data: {
                    isException: grant,
                    exceptionReason: grant ? reason : null,
                    exceptionGrantedBy: grant ? grantedBy : null
                }
            });
        } else {
            record = await prisma.attendanceEligibility.upsert({
                where: { studentId_subjectId_semester: { studentId, subjectId, semester } },
                update: { isException: grant, exceptionReason: grant ? reason : null, exceptionGrantedBy: grant ? grantedBy : null },
                create: { studentId, subjectId, semester, attendancePercent: 0, status: ELIGIBILITY_STATUS.CONDONATION, isException: grant, exceptionReason: grant ? reason : null, exceptionGrantedBy: grant ? grantedBy : null }
            });
        }

        res.json({ message: grant ? 'Exception granted.' : 'Exception rejected.', record });
    } catch (error) {
        handleError(res, error, "Failed to grant eligibility exception");
    }
};

/**
 * POST /api/eligibility/lock
 * Lock the eligibility list for a semester (prevents further changes).
 */
exports.lockEligibility = async (req, res) => {
    try {
        const { department, semester, section } = req.body;
        const semInt = parseInt(semester);

        const { count } = await prisma.attendanceEligibility.updateMany({
            where: {
                semester: semInt,
                student: {
                    department,
                    ...(section ? { section } : {})
                }
            },
            data: { isLocked: true }
        });

        res.json({ message: `Eligibility list locked. ${count} records locked.` });
    } catch (error) {
        handleError(res, error, "Failed to lock eligibility list");
    }
};
