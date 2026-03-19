const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');
const markService = require('../services/markService');
const { getDeptCriteria } = require('../utils/deptUtils');
const { handleError } = require('../utils/errorUtils');

const bcrypt = require('bcryptjs');

// Get subjects assigned to the logged-in faculty
const getAssignedSubjects = async (req, res) => {
    const facultyId = parseInt(req.user.id);
    try {
        const assignments = await prisma.facultyAssignment.findMany({
            where: { facultyId },
            include: {
                subject: true,
            }
        });

        const enhancedAssignments = await Promise.all(assignments.map(async (assignment) => {
            // Count students
            const deptCriteria = await getDeptCriteria(assignment.department || assignment.subject.department);

            const studentCount = await prisma.student.count({
                where: {
                    ...deptCriteria,
                    semester: assignment.subject.semester,
                    section: assignment.section
                }
            });

            // Calculate Avg Marks
            const students = await prisma.student.findMany({
                where: {
                    ...deptCriteria,
                    semester: assignment.subject.semester,
                    section: assignment.section
                },
                include: {
                    marks: { where: { subjectId: assignment.subject.id } }
                }
            });

            const marksData = students
                .map(s => s.marks[0]?.internal)
                .filter(m => m != null);

            const avgMarks = marksData.length > 0
                ? Math.round(marksData.reduce((a, b) => a + b, 0) / marksData.length)
                : 0;

            // Count Weekly Classes
            const weeklyClasses = await prisma.timetable.count({
                where: {
                    facultyId,
                    subjectId: assignment.subject.id,
                }
            });

            return {
                ...assignment,
                studentCount,
                avgMarks,
                weeklyClasses: weeklyClasses || 2
            };
        }));

        res.json(enhancedAssignments);
    } catch (error) {
        handleError(res, error, "Failed to get assigned subjects");
    }
};

const getClassDetails = async (req, res) => {
    const { subjectId } = req.params;
    const facultyId = parseInt(req.user.id);
    const { section, department } = req.query;
    try {
        const assignment = await prisma.facultyAssignment.findFirst({
            where: {
                subjectId: parseInt(subjectId),
                facultyId,
                ...(section && { section }),
                ...(department && { department })
            },
            include: { subject: true }
        });

        if (!assignment) return res.status(403).json({ message: 'Not authorized for this class' });

        const deptCriteria = await getDeptCriteria(department || assignment.department || assignment.subject.department);

        const studentCount = await prisma.student.count({
            where: {
                ...deptCriteria,
                semester: assignment.subject.semester,
                section: assignment.section
            }
        });

        const attendanceRecords = await prisma.studentAttendance.groupBy({
            by: ['date', 'period'],
            where: {
                subjectId: parseInt(subjectId)
            }
        });
        const classesCompleted = attendanceRecords.length;

        const timetableEntries = await prisma.timetable.findMany({
            where: {
                facultyId,
                subjectId: parseInt(subjectId)
            }
        });

        const weeklyHours = timetableEntries.reduce((sum, entry) => sum + (entry.duration || 1), 0);
        const totalWeeks = 15;
        const totalEstimatedClasses = (weeklyHours * totalWeeks) || 45;

        const percentage = Math.min(Math.round((classesCompleted / totalEstimatedClasses) * 100), 100);

        res.json({
            ...assignment,
            studentCount,
            syllabusCompletion: percentage,
            classesCompleted,
            totalEstimatedClasses
        });
    } catch (error) {
        handleError(res, error, "Failed to get class details");
    }
};

const getClassStudents = async (req, res) => {
    const { subjectId } = req.params;
    const facultyId = parseInt(req.user.id);
    const { section, department } = req.query;
    try {
        const assignment = await prisma.facultyAssignment.findFirst({
            where: {
                subjectId: parseInt(subjectId),
                facultyId,
                ...(section && { section }),
                ...(department && { department })
            },
            include: { subject: true }
        });

        if (!assignment) return res.status(403).json({ message: 'Not authorized' });

        const deptCriteria = await getDeptCriteria(department || assignment.department || assignment.subject.department);

        const students = await prisma.student.findMany({
            where: {
                ...deptCriteria,
                semester: assignment.subject.semester,
                section: section || assignment.section
            },
            include: {
                marks: { where: { subjectId: parseInt(subjectId) } },
                attendance: { where: { subjectId: parseInt(subjectId) } }
            },
            orderBy: { rollNo: 'asc' }
        });

        const data = students.map(s => {
            // Use actual attendance records for this student+subject as denominator
            const allPeriods = new Set(s.attendance.map(a => `${a.date}_${a.period}`));
            const totalClasses = allPeriods.size || s.attendance.length;
            const presentCount = s.attendance.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
            const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
            const mark = s.marks[0];

            const isCiaAbsent = mark ? (mark.cia1_test === -1 && mark.cia1_assignment === -1 && mark.cia1_attendance === -1) &&
                (mark.cia2_test === -1 && mark.cia2_assignment === -1 && mark.cia2_attendance === -1) &&
                (mark.cia3_test === -1 && mark.cia3_assignment === -1 && mark.cia3_attendance === -1) : false;

            return {
                id: s.id,
                rollNo: s.rollNo,
                registerNumber: s.registerNumber,
                name: s.name,
                attendancePercentage: Math.min(percentage, 100),
                ciaTotal: mark?.internal || 0,
                isCiaAbsent,
                status: percentage >= 75 ? 'Eligible' : 'Shortage'
            };
        });

        res.json(data);
    } catch (error) {
        handleError(res, error, "Failed to get class students");
    }
};

const getClassAttendance = async (req, res) => {
    const { subjectId } = req.params;
    try {
        const attendance = await prisma.studentAttendance.findMany({
            where: { subjectId: parseInt(subjectId) },
            orderBy: { date: 'desc' }
        });

        const grouped = {};
        attendance.forEach(r => {
            const key = `${r.date}__P${r.period}`;
            if (!grouped[key]) grouped[key] = { date: r.date, period: r.period, present: 0, absent: 0, total: 0 };
            grouped[key].total++;
            if (r.status === 'PRESENT' || r.status === 'OD') grouped[key].present++;
            else grouped[key].absent++;
        });

        const result = Object.values(grouped).map(d => ({
            ...d,
            percentage: Math.round((d.present / d.total) * 100)
        }));

        res.json(result);
    } catch (error) {
        handleError(res, error, "Failed to get class attendance");
    }
};

const getSubjectMarks = async (req, res) => {
    const { subjectId } = req.params;
    try {
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const assignment = await prisma.facultyAssignment.findFirst({
            where: {
                subjectId: parseInt(subjectId),
                facultyId: parseInt(req.user.id)
            }
        });

        if (!assignment) {
            return res.status(403).json({ message: 'You are not assigned to this subject.' });
        }

        const deptCriteria = await getDeptCriteria(assignment.department || subject.department);

        const students = await prisma.student.findMany({
            where: {
                ...deptCriteria,
                semester: subject.semester,
                section: assignment.section
            },
            include: {
                marks: {
                    where: { subjectId: parseInt(subjectId) }
                }
            },
            orderBy: { rollNo: 'asc' }
        });

        const result = students.map(s => ({
            studentId: s.id,
            rollNo: s.rollNo,
            registerNumber: s.registerNumber,
            name: s.name,
            marks: s.marks[0] || {}
        }));

        res.json(result);
    } catch (error) {
        handleError(res, error, "Failed to get subject marks");
    }
};

const updateMarks = async (req, res) => {
    const { studentId, subjectId, fieldMarks = {} } = req.body;
    try {
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        const subjectCategory = subject.subjectCategory || 'THEORY';

        const currentMark = await prisma.marks.findUnique({
            where: { studentId_subjectId: { studentId: parseInt(studentId), subjectId: parseInt(subjectId) } }
        });

        const touchingFields = Object.keys(fieldMarks).filter(f => fieldMarks[f] !== undefined);
        
        // Lock Check
        const lockError = await markService.checkLockStatus(parseInt(studentId), currentMark, touchingFields);
        if (lockError) return res.status(403).json({ message: lockError });

        // Calculation
        const { internal, isApproved_cia1, isApproved_cia2, isApproved_cia3 } = markService.calculateInternalMarks(currentMark, fieldMarks, subjectCategory);
        
        const finalUpdates = {
            ...fieldMarks,
            internal,
            isApproved_cia1: isApproved_cia1 ?? false,
            isApproved_cia2: isApproved_cia2 ?? false,
            isApproved_cia3: isApproved_cia3 ?? false
        };

        const updated = await prisma.marks.upsert({
            where: { studentId_subjectId: { studentId: parseInt(studentId), subjectId: parseInt(subjectId) } },
            update: finalUpdates,
            create: {
                studentId: parseInt(studentId),
                subjectId: parseInt(subjectId),
                ...finalUpdates
            }
        });

        res.json(updated);
    } catch (error) {
        handleError(res, error, "Failed to update marks");
    }
};

const bulkUpdateMarks = async (req, res) => {
    const { updates = [], subjectId } = req.body; // updates = [{ studentId, ...fieldMarks }]
    try {
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        const subjectCategory = subject.subjectCategory || 'THEORY';

        const results = [];
        const errors = [];

        // Run in a transaction for atomicity and performance
        await prisma.$transaction(async (tx) => {
            for (const item of updates) {
                const { studentId, ...fieldUpdates } = item;
                
                const currentMark = await tx.marks.findUnique({
                    where: { studentId_subjectId: { studentId: parseInt(studentId), subjectId: parseInt(subjectId) } }
                });

                const touchingFields = Object.keys(fieldUpdates).filter(f => fieldUpdates[f] !== undefined);
                if (touchingFields.length === 0) continue;

                // Lock Check
                const lockError = await markService.checkLockStatus(parseInt(studentId), currentMark, touchingFields);
                if (lockError) {
                    errors.push({ studentId, error: lockError });
                    continue;
                }

                // Calculation
                const { internal, isApproved_cia1, isApproved_cia2, isApproved_cia3 } = markService.calculateInternalMarks(currentMark, fieldUpdates, subjectCategory);
                const finalUpdates = {
                    ...fieldUpdates,
                    internal,
                    isApproved_cia1: isApproved_cia1 ?? false,
                    isApproved_cia2: isApproved_cia2 ?? false,
                    isApproved_cia3: isApproved_cia3 ?? false
                };

                const updated = await tx.marks.upsert({
                    where: { studentId_subjectId: { studentId: parseInt(studentId), subjectId: parseInt(subjectId) } },
                    update: finalUpdates,
                    create: {
                        studentId: parseInt(studentId),
                        subjectId: parseInt(subjectId),
                        ...finalUpdates
                    }
                });
                results.push(updated);
            }
        });

        res.json({
            message: `Successfully processed ${results.length} records.`,
            updatedCount: results.length,
            errorCount: errors.length,
            errors
        });
    } catch (error) {
        handleError(res, error, "Bulk update failed");
    }
};

const getFacultyDashboardStats = async (req, res) => {
    try {
        const facultyId = parseInt(req.user.id);
        const assignments = await prisma.facultyAssignment.findMany({
            where: { facultyId },
            include: { subject: true }
        });

        const assignedSubjects = assignments.length;

        // Batch all per-assignment queries using Promise.all
        const assignmentStats = await Promise.all(assignments.map(async (assignment) => {
            const deptCriteria = await getDeptCriteria(assignment.department || assignment.subject.department);
            const students = await prisma.student.findMany({
                where: { ...deptCriteria, semester: assignment.subject.semester, section: assignment.section },
                include: { marks: { where: { subjectId: assignment.subject.id } } }
            });

            const marksData = students.map(s => s.marks[0]?.internal).filter(m => m != null);
            const avgMarks = marksData.length > 0
                ? Math.round(marksData.reduce((a, b) => a + b, 0) / marksData.length)
                : 0;

            const marksCount = await prisma.marks.count({
                where: { subjectId: assignment.subject.id, internal: { not: null } }
            });

            return {
                subject: assignment.subject.shortName || assignment.subject.name,
                average: avgMarks,
                studentCount: students.length,
                marksCount
            };
        }));

        const totalStudents = assignmentStats.reduce((sum, a) => sum + a.studentCount, 0);
        const classPerformance = assignmentStats.map(a => ({ subject: a.subject, average: a.average, students: a.studentCount }));
        const totalMarksEntries = assignmentStats.reduce((sum, a) => sum + a.studentCount, 0);
        const submittedMarksEntries = assignmentStats.reduce((sum, a) => sum + a.marksCount, 0);
        const submissionPercentage = totalMarksEntries > 0 ? Math.round((submittedMarksEntries / totalMarksEntries) * 100) : 0;

        // ✅ FIX: removed dead `allInternals` variable that was always empty and unused
        const avgPerformance = classPerformance.length > 0
            ? (classPerformance.reduce((s, a) => s + a.average, 0) / classPerformance.length).toFixed(1)
            : '0.0';

        const timetable = await prisma.timetable.findMany({ where: { facultyId } });
        const classesThisWeek = timetable.length;

        // Real weekly attendance trend — last 5 weeks
        const now = new Date();
        const weeklyTrend = [];
        for (let w = 4; w >= 0; w--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (w * 7) - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const startStr = weekStart.toISOString().split('T')[0];
            const endStr = weekEnd.toISOString().split('T')[0];

            const records = await prisma.studentAttendance.findMany({
                where: {
                    subjectId: { in: assignments.map(a => a.subject.id) },
                    date: { gte: startStr, lte: endStr }
                },
                select: { status: true }
            });

            const total = records.length;
            const present = records.filter(r => r.status === 'PRESENT' || r.status === 'OD').length;
            const rate = total > 0 ? Math.round((present / total) * 100) : 0;
            weeklyTrend.push({ week: `Week ${5 - w}`, rate });
        }

        res.json({
            assignedSubjects,
            totalStudents,
            classesThisWeek,
            avgPerformance,
            classPerformance,
            marksSubmissionStatus: [
                { name: 'Submitted', value: submissionPercentage, color: '#10b981' },
                { name: 'Pending', value: 100 - submissionPercentage, color: '#f59e0b' }
            ],
            attendanceTrend: weeklyTrend
        });
    } catch (error) {
        handleError(res, error, "Failed to get faculty dashboard stats");
    }
};

const getMyTimetable = async (req, res) => {
    try {
        const facultyId = parseInt(req.user.id);
        const { date } = req.query;
        let timetable = await prisma.timetable.findMany({ where: { facultyId }, include: { subject: true } });

        if (date) {
            const dateObj = new Date(date);
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const dayOfWeek = days[dateObj.getUTCDay()];

            const myAbsences = await prisma.facultyAbsence.findMany({ where: { facultyId, date } });
            const isFullDayAbsent = myAbsences.some(a => a.period === 0);
            const mySubstitutedSlots = await prisma.substitution.findMany({
                where: { date, timetable: { facultyId } },
                include: { substituteFaculty: true }
            });

            timetable = timetable.map(t => {
                // We show all days, but only apply "isCovered" flags to the day that matches `selectedDate`.
                if (t.day !== dayOfWeek) return t;

                const specificAbsence = myAbsences.find(a => a.period === t.period);
                const sub = mySubstitutedSlots.find(s => s.timetableId === t.id);
                if (isFullDayAbsent || specificAbsence) {
                    return { ...t, isCovered: true, coveredBy: sub ? sub.substituteFaculty.fullName : 'Faculty Absent' };
                }
                return t;
            });

            const substitutions = await prisma.substitution.findMany({
                where: { substituteFacultyId: facultyId, date },
                include: { timetable: { include: { subject: true } } }
            });

            if (substitutions.length > 0) {
                const subEntries = substitutions.map(sub => ({
                    id: `sub-${sub.id}`,
                    ...sub.timetable,
                    day: dayOfWeek, // Bind the substitute entry to the dayOfWeek of the Selected Date
                    isSubstitute: true,
                    originalFaculty: sub.timetable.facultyName
                }));
                timetable = [...timetable, ...subEntries];
            }
        }
        res.json(timetable);
    } catch (error) {
        handleError(res, error, "Failed to get timetable");
    }
};

const exportClassAttendanceExcel = async (req, res) => {
    const { subjectId } = req.params;
    const facultyId = parseInt(req.user.id);
    const { fromDate, toDate } = req.query;
    try {
        const assignment = await prisma.facultyAssignment.findFirst({
            where: { subjectId: parseInt(subjectId), facultyId },
            include: { subject: true }
        });
        if (!assignment) return res.status(403).json({ message: 'Not authorized' });

        const deptCriteria = await getDeptCriteria(assignment.department || assignment.subject.department);

        // Fetch all attendance for this subject (filter in JS for reliable string date comparison)
        const students = await prisma.student.findMany({
            where: { ...deptCriteria, semester: assignment.subject.semester, section: assignment.section },
            include: { attendance: { where: { subjectId: parseInt(subjectId) } } },
            orderBy: { rollNo: 'asc' }
        });

        // Filter attendance records by date range in JavaScript (safe for String dates)
        const filterByDate = (records) => {
            return records.filter(a => {
                if (fromDate && a.date < fromDate) return false;
                if (toDate && a.date > toDate) return false;
                return true;
            });
        };

        // Calculate total periods conducted in the date range (distinct date+period slots)
        const allAttendanceInRange = students.length > 0 ? filterByDate(students[0].attendance) : [];
        // Collect all distinct date+period slots from ALL students
        const allSlots = new Set();
        students.forEach(s => {
            filterByDate(s.attendance).forEach(a => {
                allSlots.add(`${a.date}_${a.period}`);
            });
        });
        const totalPeriodsConducted = allSlots.size;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        // Use direct cell assignment — 100% guaranteed row order, no ExcelJS auto-header interference
        const headers = ['Roll No', 'Reg No', 'Student Name', 'Department', 'Year', 'Semester', 'Section', 'Presents', 'Absents', 'OD', 'Attendance %', 'Status'];
        const colWidths = [15, 15, 30, 15, 8, 10, 10, 12, 12, 10, 15, 12];

        // Row 1 — Subject
        worksheet.getCell('A1').value = `Subject: ${assignment.subject.name} (${assignment.subject.code})`;
        worksheet.getCell('A1').font = { bold: true, size: 12 };

        // Row 2 — Date range
        worksheet.getCell('A2').value = `Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`;

        // Row 3 — Total periods conducted
        worksheet.getCell('A3').value = `Total Periods Conducted: ${totalPeriodsConducted}`;
        worksheet.getCell('A3').font = { bold: true, color: { argb: 'FF003B73' } };

        // Row 4 — blank separator
        // (leave empty)

        // Row 5 — Column headers
        headers.forEach((h, i) => {
            const cell = worksheet.getCell(5, i + 1);
            cell.value = h;
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        });

        // Rows 6+ — Student data
        let rowIndex = 6;
        students.forEach(s => {
            const filtered = filterByDate(s.attendance);
            const total = filtered.length;
            const od = filtered.filter(a => a.status === 'OD').length;
            const presentOnly = filtered.filter(a => a.status === 'PRESENT').length;
            const presentTotal = presentOnly + od;
            const absent = total - presentTotal;
            const percentage = total > 0 ? ((presentTotal / total) * 100).toFixed(2) : '0.00';
            const rowData = [s.rollNo, s.registerNumber || '-', s.name, s.department, s.year, s.semester, s.section, presentOnly, absent, od, percentage, parseFloat(percentage) >= 75 ? 'Eligible' : 'Shortage'];
            rowData.forEach((val, i) => {
                worksheet.getCell(rowIndex, i + 1).value = val;
            });
            rowIndex++;
        });

        // Footer
        worksheet.getCell(rowIndex + 1, 1).value = 'Note: OD (On Duty) is treated as Present for all attendance calculations.';
        worksheet.getCell(rowIndex + 1, 1).font = { italic: true, color: { argb: 'FF666666' } };

        // Set column widths
        colWidths.forEach((w, i) => { worksheet.getColumn(i + 1).width = w; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_${subjectId}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        handleError(res, error, "Failed to export attendance");
    }
};


const getFaculties = async (req, res) => {
    try {
        const { role, departmentId } = req.query;
        const facultyList = await prisma.faculty.findMany({
            where: {
                isActive: true, // only active
                ...(role && { role }),
                ...(departmentId && { departmentId: parseInt(departmentId) })
            },
            orderBy: { fullName: 'asc' },
            select: {
                id: true, staffId: true, fullName: true, department: true, departmentId: true,
                role: true, photo: true, designation: true, qualification: true,
                phone: true, email: true, isActive: true, createdAt: true
            }
        });

        // Fetch First Year Coordinator Setting
        const fycSetting = await prisma.systemSetting.findUnique({
            where: { key: 'FIRST_YEAR_COORDINATOR_ID' }
        });
        const fycId = fycSetting ? parseInt(fycSetting.value) : null;

        const enriched = facultyList.map(f => {
            const roles = ['FACULTY'];
            if (f.role === 'HOD') roles.push('HOD');
            if (fycId && f.id === fycId) roles.push('FIRST_YEAR_COORDINATOR');

            return {
                ...f,
                computedRoles: roles
            };
        });

        res.json(enriched);
    } catch (error) {
        handleError(res, error, "Failed to get faculties");
    }
};

const getFacultyProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const faculty = await prisma.faculty.findUnique({
            where: { id: parseInt(id) },
            include: {
                assignments: { include: { subject: true } },
                timetables: { include: { subject: true } }
            }
        });
        if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
        
        const { password, ...safeFaculty } = faculty;
        res.json(safeFaculty);
    } catch (error) {
        handleError(res, error, "Failed to get faculty profile");
    }
};

const createFaculty = async (req, res) => {
    try {
        const { computedRoles, ...facultyData } = req.body;
        if (!facultyData.staffId) return res.status(400).json({ message: 'Staff Roll No (staffId) is required' });

        const existing = await prisma.faculty.findUnique({ where: { staffId: facultyData.staffId } });
        if (existing) return res.status(400).json({ message: 'Staff Roll No already exists' });

        const hashedPassword = await bcrypt.hash('password123', 10);
        
        let photoPath = null;
        if (req.file) {
            photoPath = req.file.filename;
        }

        if (facultyData.departmentId) facultyData.departmentId = parseInt(facultyData.departmentId);

        const faculty = await prisma.faculty.create({
            data: {
                ...facultyData,
                photo: photoPath,
                password: hashedPassword,
                role: 'FACULTY', // Strictly enforced during creation
                isActive: true
            }
        });

        const { password, ...safeFaculty } = faculty;
        res.status(201).json(safeFaculty);
    } catch (error) {
        handleError(res, error, "Failed to create faculty");
    }
};

const updateFaculty = async (req, res) => {
    const { id } = req.params;
    const fId = parseInt(id);
    try {
        let { computedRoles, ...facultyData } = req.body;
        
        // NEVER update password here
        delete facultyData.password;

        if (req.file) {
            facultyData.photo = req.file.filename;
        }

        if (facultyData.departmentId) facultyData.departmentId = parseInt(facultyData.departmentId);

        if (typeof computedRoles === 'string') {
            try { computedRoles = JSON.parse(computedRoles); } catch (e) { computedRoles = []; }
        }

        if (computedRoles && Array.isArray(computedRoles)) {
            if (computedRoles.includes('HOD')) {
                facultyData.role = 'HOD';
            } else {
                facultyData.role = 'FACULTY';
            }
        }

        const faculty = await prisma.faculty.update({
            where: { id: fId },
            data: facultyData
        });

        // HOD Logic update if role changed
        if (faculty.role === 'HOD' && faculty.departmentId) {
             await prisma.faculty.updateMany({
                where: { 
                    departmentId: faculty.departmentId, 
                    role: 'HOD',
                    id: { not: fId }
                },
                data: { role: 'FACULTY' }
            });

            await prisma.department.update({
                where: { id: faculty.departmentId },
                data: { 
                    hodId: fId,
                    hodName: faculty.fullName
                }
            });
        } else if (faculty.role !== 'HOD' && faculty.departmentId) {
            // Check if they were the HOD and we are removing the role
            const dept = await prisma.department.findUnique({ where: { id: faculty.departmentId } });
            if (dept?.hodId === fId) {
                await prisma.department.update({
                    where: { id: faculty.departmentId },
                    data: { hodId: null, hodName: null }
                });
            }
        }

        // Handle Coordinator constraint
        if (computedRoles && Array.isArray(computedRoles)) {
            if (computedRoles.includes('FIRST_YEAR_COORDINATOR')) {
                await prisma.systemSetting.upsert({
                    where: { key: 'FIRST_YEAR_COORDINATOR_ID' },
                    update: { value: fId.toString() },
                    create: { key: 'FIRST_YEAR_COORDINATOR_ID', value: fId.toString() }
                });
            } else {
                const currentSetting = await prisma.systemSetting.findUnique({ where: { key: 'FIRST_YEAR_COORDINATOR_ID' } });
                if (currentSetting && parseInt(currentSetting.value) === fId) {
                    await prisma.systemSetting.delete({ where: { key: 'FIRST_YEAR_COORDINATOR_ID' } });
                }
            }
        }

        const { password, ...safeFaculty } = faculty;
        res.json(safeFaculty);
    } catch (error) {
        handleError(res, error, "Failed to update faculty");
    }
};

const deleteFaculty = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete
        await prisma.faculty.update({ 
            where: { id: parseInt(id) },
            data: { isActive: false }
        });
        res.json({ message: 'Faculty deactivated successfully' });
    } catch (error) {
        handleError(res, error, "Failed to delete faculty");
    }
};

const bulkUploadFaculty = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        const hashedPassword = await bcrypt.hash('password123', 10);
        let createdCount = 0;
        const failed = [];

        // Skip header
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) rows.push({ rowNumber, row });
        });

        for (const { rowNumber, row } of rows) {
            const staffId = row.getCell(1).text?.trim();
            const fullName = row.getCell(2).text?.trim();
            const deptName = row.getCell(3).text?.trim();
            const role = row.getCell(4).text?.trim()?.toUpperCase() || 'FACULTY';
            const designation = row.getCell(5).text?.trim();
            const qualification = row.getCell(6).text?.trim();
            const phone = row.getCell(7).text?.trim();
            const email = row.getCell(8).text?.trim();
            const dateOfBirth = row.getCell(9).text?.trim();
            const gender = row.getCell(10).text?.trim();
            const bloodGroup = row.getCell(11).text?.trim();
            const address = row.getCell(12).text?.trim();

            if (!staffId || !fullName) {
                failed.push({ row: rowNumber, staffId: staffId || 'N/A', reason: 'Missing Staff ID or Full Name' });
                continue;
            }

            try {
                // Find department ID if possible
                let deptId = null;
                if (deptName) {
                    const dept = await prisma.department.findFirst({
                        where: { OR: [{ name: deptName }, { code: deptName }] }
                    });
                    if (dept) deptId = dept.id;
                }

                const faculty = await prisma.faculty.upsert({
                    where: { staffId },
                    update: {
                        fullName, department: deptName, departmentId: deptId, role,
                        designation, qualification, phone, email, dateOfBirth,
                        gender, bloodGroup, address, isActive: true
                    },
                    create: {
                        staffId, fullName, department: deptName, departmentId: deptId, role,
                        designation, qualification, phone, email, dateOfBirth,
                        gender, bloodGroup, address, password: hashedPassword, isActive: true
                    }
                });

                // HOD logic for bulk upload
                if (role === 'HOD' && deptId) {
                    await prisma.faculty.updateMany({
                        where: { departmentId: deptId, role: 'HOD', id: { not: faculty.id } },
                        data: { role: 'FACULTY' }
                    });
                    await prisma.department.update({
                        where: { id: deptId },
                        data: { hodId: faculty.id, hodName: faculty.fullName }
                    });
                }

                createdCount++;
            } catch (err) {
                failed.push({ row: rowNumber, staffId, reason: err.message });
            }
        }

        res.json({ created: createdCount, failed });
    } catch (error) {
        handleError(res, error, "Bulk upload failed");
    }
};

module.exports = {
    getAssignedSubjects, getSubjectMarks, updateMarks, bulkUpdateMarks, getFacultyDashboardStats,
    getMyTimetable, getClassDetails, getClassStudents, getClassAttendance, exportClassAttendanceExcel,
    getFaculties, getFacultyProfile, createFaculty, updateFaculty, deleteFaculty, bulkUploadFaculty
};
