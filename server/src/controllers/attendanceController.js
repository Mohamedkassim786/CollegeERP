const prisma = require('../lib/prisma');
const { getDeptCriteria } = require('../utils/deptUtils');
const { handleError } = require('../utils/errorUtils');

// --- Faculty Actions ---

// Get list of students for attendance (by subject & section)
const getStudentsForAttendance = async (req, res) => {
    const { subjectId, section, date } = req.query;
    try {
        const facultyId = parseInt(req.user.id);
        // Try to find the specific assignment for this faculty to get the correct department(s)
        const assignment = await prisma.facultyAssignment.findFirst({
            where: { facultyId, subjectId: parseInt(subjectId), section }
        });

        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Use assignment department if available (handles MECH, CIVIL etc), fallback to subject department
        const deptCriteria = await getDeptCriteria(assignment?.department || subject.department);

        const students = await prisma.student.findMany({
            where: {
                ...deptCriteria,
                semester: subject.semester,
                section: section
            },
            orderBy: { rollNo: 'asc' }
        });

        const period = req.query.period ? parseInt(req.query.period) : 0;
        const existingAttendance = await prisma.studentAttendance.findMany({
            where: { subjectId: parseInt(subjectId), date: date, period: period }
        });

        const attendanceMap = {};
        existingAttendance.forEach(a => attendanceMap[a.studentId] = a.status);

        const result = students.map(s => ({
            id: s.id,
            rollNo: s.rollNo,
            name: s.name,
            registerNumber: s.registerNumber,
            // ✅ FIX Bug #9: was defaulting to 'PRESENT' — unrecorded students now show null
            // so the UI can display a clear "not yet marked" state instead of silent Present
            status: attendanceMap[s.id] || null
        }));

        res.json({ students: result, isAlreadyTaken: existingAttendance.length > 0 });
    } catch (error) {
        handleError(res, error, "Failed to fetch students for attendance");
    }
};

// Submit Attendance
const submitAttendance = async (req, res) => {
    const { subjectId, date, period, attendanceData } = req.body;
    const facultyId = req.user.id;
    try {
        const today = new Date().toISOString().split('T')[0];
        if (date > today) {
            return res.status(400).json({ message: 'Attendance cannot be submitted for a future date.' });
        }

        // 🔒 CHECK LOCK STATUS
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        const studentObj = await prisma.student.findFirst({ where: { section: studentData?.section || undefined, id: attendanceData[0]?.studentId } }); // Sample to get dept/sec
        
        // This is a bit complex due to sparse data. Better check by subject's default target
        const control = await prisma.semesterControl.findFirst({
            where: {
                semester: subject?.semester,
                section: attendanceData[0]?.section || undefined // We might not have section in body
            }
        });

        // Simpler lookup: Check if any published/locked control exists for this subject's semester/section
        // We'll need to find the student's current assignment section
        const assignment = await prisma.facultyAssignment.findFirst({
            where: { facultyId: parseInt(facultyId), subjectId: parseInt(subjectId) }
        });

        if (assignment) {
            const semControl = await prisma.semesterControl.findFirst({
                where: {
                    semester: subject.semester,
                    section: assignment.section
                }
            });
            if (semControl?.isLocked || semControl?.isPublished) {
                return res.status(403).json({ message: 'Attendance is locked for this semester/section. Marks have been processed.' });
            }
        }

        const sId = parseInt(subjectId);
        const pId = period ? parseInt(period) : 0;

        const operations = attendanceData.map(record => {
            return prisma.studentAttendance.upsert({
                where: { studentId_subjectId_date_period: { studentId: record.studentId, subjectId: sId, date: date, period: pId } },
                update: { status: record.status, facultyId: facultyId },
                create: { studentId: record.studentId, subjectId: sId, date: date, period: pId, status: record.status, facultyId: facultyId }
            });
        });

        await prisma.$transaction(operations);
        res.json({ message: 'Attendance submitted successfully', count: operations.length });
    } catch (error) {
        handleError(res, error, "Failed to submit attendance");
    }
};

// --- Admin/Report Actions ---

const getAttendanceReport = async (req, res) => {
    const { department, year, section, fromDate, toDate, subjectId, studentId } = req.query;
    try {
        const where = {};
        if (studentId) {
            where.id = parseInt(studentId);
        }

        // If subjectId is provided but no other criteria, get department/semester/section from assignment
        if (subjectId && !department && !year && !section) {
            // Priority: Try to find assignment for the LOGGED-IN faculty first
            let assignment = null;
            if (req.user.role === 'FACULTY' || req.user.role === 'EXTERNAL_STAFF') {
                assignment = await prisma.facultyAssignment.findFirst({
                    where: { subjectId: parseInt(subjectId), facultyId: parseInt(req.user.id) },
                    include: { subject: true }
                });
            }

            // Fallback: If not found or user is Admin, get any assignment for that subject
            if (!assignment) {
                assignment = await prisma.facultyAssignment.findFirst({
                    where: { subjectId: parseInt(subjectId) },
                    include: { subject: true }
                });
            }

            if (assignment) {
                const deptFilter = await getDeptCriteria(assignment.department || assignment.subject.department);
                Object.assign(where, deptFilter);
                where.semester = assignment.subject.semester;
                where.section = assignment.section;
            }
        } else {
            // Broaden search for Year 1 (GEN) students
            if (department || String(year) === '1') {
                const searchDept = String(year) === '1' ? 'GEN' : department;
                const deptFilter = await getDeptCriteria(searchDept);
                Object.assign(where, deptFilter);
            }
            if (year) where.year = parseInt(year);
            if (section) where.section = section;
        }

        // ✅ FIX Bug #4: build date filter conditionally — undefined values caused silent all-time fetches
        const dateFilter = {};
        if (fromDate) dateFilter.gte = fromDate;
        if (toDate) dateFilter.lte = toDate;

        const students = await prisma.student.findMany({
            where: { ...where },
            include: {
                attendance: {
                    where: {
                        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
                        ...(subjectId && { subjectId: parseInt(subjectId) })
                    }
                }
            },
            orderBy: { rollNo: 'asc' }
        });

        const report = students.map(s => {
            const total = s.attendance.length;
            const present = s.attendance.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
            const od = s.attendance.filter(a => a.status === 'OD').length;
            const absent = total - present;
            const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : '0.00';

            return {
                id: s.id,
                rollNo: s.rollNo,
                registerNumber: s.registerNumber,
                name: s.name,
                totalClasses: total,
                present,
                od,
                absent,
                percentage
            };
        });

        let distinctSlots = [];
        if (subjectId) {
            distinctSlots = await prisma.studentAttendance.groupBy({
                by: ['date', 'period'],
                where: {
                    subjectId: parseInt(subjectId),
                    date: { gte: fromDate, lte: toDate }
                }
            });
        }

        res.json({
            students: report,
            totalPeriodsConducted: distinctSlots.length
        });
    } catch (error) {
        handleError(res, error, "Failed to fetch attendance report");
    }
};

const getDepartmentAttendanceReport = async (req, res) => {
    const { department, semester, section } = req.query;
    try {
        if (!department || !semester) {
            return res.status(400).json({ message: 'department and semester are required' });
        }

        const semInt = parseInt(semester);

        // Get subjects for this dept+semester
        const subjects = await prisma.subject.findMany({
            where: {
                semester: semInt,
                OR: [{ department }, { type: 'COMMON' }]
            },
            orderBy: { code: 'asc' }
        });

        // Get students
        const students = await prisma.student.findMany({
            where: {
                department,
                semester: semInt,
                ...(section ? { section } : {}),
                status: 'ACTIVE'
            },
            include: {
                attendance: true
            },
            orderBy: { rollNo: 'asc' }
        });

        // Get student IDs
        const studentIds = students.map(s => s.id);
        const subjectIds = subjects.map(s => s.id);

        // Fetch attendance counts in a single grouped query
        const attendanceStats = await prisma.studentAttendance.groupBy({
            by: ['studentId', 'subjectId', 'status'],
            where: {
                studentId: { in: studentIds },
                subjectId: { in: subjectIds }
            },
            _count: true
        });

        // Group stats into a nested map for O(1) lookup
        const statsMap = {};
        attendanceStats.forEach(stat => {
            if (!statsMap[stat.studentId]) statsMap[stat.studentId] = {};
            if (!statsMap[stat.studentId][stat.subjectId]) {
                statsMap[stat.studentId][stat.subjectId] = { total: 0, present: 0 };
            }
            statsMap[stat.studentId][stat.subjectId].total += stat._count;
            if (stat.status === 'PRESENT' || stat.status === 'OD') {
                statsMap[stat.studentId][stat.subjectId].present += stat._count;
            }
        });

        const report = students.map(student => {
            const subjectData = subjects.map(subject => {
                const stats = statsMap[student.id]?.[subject.id] || { total: 0, present: 0 };
                const percent = stats.total > 0 ? parseFloat(((stats.present / stats.total) * 100).toFixed(1)) : 0;
                return {
                    subjectId: subject.id,
                    subjectCode: subject.code,
                    subjectName: subject.name,
                    total: stats.total,
                    present: stats.present,
                    percent
                };
            });

            return {
                studentId: student.id,
                rollNo: student.rollNo,
                name: student.name,
                section: student.section,
                subjects: subjectData
            };
        });

        res.json(report);
    } catch (error) {
        handleError(res, error, "Failed to fetch department attendance report");
    }
};

module.exports = {
    getStudentsForAttendance,
    submitAttendance,
    getAttendanceReport,
    getDepartmentAttendanceReport
};
