const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const { getDeptCriteria } = require('../utils/deptUtils');

const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

const getDashboardStats = async (req, res) => {
    try {
        const [studentCount, facultyCount, subjectCount, deptCount] = await Promise.all([
            prisma.student.count(),
            prisma.user.count({ where: { role: 'FACULTY' } }),
            prisma.subject.count(),
            prisma.department.count()
        ]);

        // 1. Department Data
        const departments = await prisma.department.findMany({ select: { name: true, code: true } });

        const studentsPerDept = await prisma.student.groupBy({
            by: ['department'],
            _count: { id: true }
        });
        const facultyPerDept = await prisma.user.groupBy({
            by: ['department'],
            where: { role: 'FACULTY' },
            _count: { id: true }
        });

        const departmentData = departments.map(d => {
            const matchKey = d.code || d.name; // Use code first if available
            const students = studentsPerDept.find(s => s.department === matchKey)?._count.id || 0;
            const faculty = facultyPerDept.find(f => f.department === matchKey)?._count.id || 0;
            return { dept: d.name, students, faculty };
        });

        // 2. Average Attendance
        const totalAttendance = await prisma.studentAttendance.count();
        const presentCount = await prisma.studentAttendance.count({
            where: { status: { in: ['PRESENT', 'OD'] } }
        });
        const avgAttendance = totalAttendance > 0
            ? Math.round((presentCount / totalAttendance) * 100)
            : 0;

        // 3. Performance Trend (Monthly average of internal marks)
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date();
        const performanceTrendMapp = {};

        for (let i = 5; i >= 0; i--) {
            let m = new Date(d.getFullYear(), d.getMonth() - i, 1);
            let mName = monthNames[m.getMonth()];
            performanceTrendMapp[mName] = { month: mName, total: 0, count: 0, target: 80 };
        }

        const allMarks = await prisma.marks.findMany({
            select: { internal: true, updatedAt: true },
            where: { internal: { not: null } }
        });

        allMarks.forEach(m => {
            const mName = monthNames[m.updatedAt.getMonth()];
            if (performanceTrendMapp[mName]) {
                performanceTrendMapp[mName].total += m.internal;
                performanceTrendMapp[mName].count += 1;
            }
        });

        const performanceTrend = Object.values(performanceTrendMapp).map(p => {
            const avg = p.count > 0 ? (p.total / p.count) * 2 : 0; // Assuming internal marks are mostly out of 50, scale to 100 for percentage
            return {
                month: p.month,
                average: Math.round(avg),
                target: p.target
            };
        });

        // 4. Marks Distribution (Real CGPA values)
        const results = await prisma.semesterResult.findMany({ select: { cgpa: true } });
        let marksDistribution = [
            { range: '9-10 CGPA', count: 0, color: '#10b981' },
            { range: '8-9 CGPA', count: 0, color: '#3b82f6' },
            { range: '7-8 CGPA', count: 0, color: '#f59e0b' },
            { range: '< 7 CGPA', count: 0, color: '#ef4444' }
        ];
        if (results.length > 0) {
            results.forEach(r => {
                if (r.cgpa >= 9) marksDistribution[0].count++;
                else if (r.cgpa >= 8) marksDistribution[1].count++;
                else if (r.cgpa >= 7) marksDistribution[2].count++;
                else marksDistribution[3].count++;
            });
        }

        // 5. Weekly Attendance Rate
        const recentDates = await prisma.studentAttendance.groupBy({
            by: ['date'],
            _count: { id: true },
            orderBy: { date: 'desc' },
            take: 5
        });
        let attendanceData = [];
        if (recentDates.length > 0) {
            const chronologicalDates = [...recentDates].reverse();
            for (const d of chronologicalDates) {
                const dayStat = await prisma.studentAttendance.count({
                    where: { date: d.date, status: { in: ['PRESENT', 'OD'] } }
                });
                const rate = Math.round((dayStat / d._count.id) * 100);
                const dayObj = new Date(d.date);
                const dayName = isNaN(dayObj.getTime()) ? d.date.substring(0, 3) : dayObj.toLocaleDateString('en-US', { weekday: 'short' });
                attendanceData.push({ day: dayName, rate });
            }
        } else {
            // Emtpy data points if no attendance historically
            const last5Days = [];
            const dt = new Date();
            for (let i = 4; i >= 0; i--) {
                const dDate = new Date(dt.getTime() - (i * 24 * 60 * 60 * 1000));
                last5Days.push({
                    day: dDate.toLocaleDateString('en-US', { weekday: 'short' }),
                    rate: 0
                });
            }
            attendanceData = last5Days;
        }

        // 6. Recent Activities
        const recentActivityLogs = await prisma.activityLog.findMany({
            take: 4,
            orderBy: { timestamp: 'desc' },
            include: { performer: { select: { fullName: true, username: true, role: true } } }
        });

        let recentActivities = recentActivityLogs.map(log => {
            const timeDiff = Math.floor((new Date() - new Date(log.timestamp)) / 60000); // in minutes
            let timeStr = `${timeDiff} mins ago`;
            if (timeDiff > 60 && timeDiff < 1440) timeStr = `${Math.floor(timeDiff / 60)} hours ago`;
            else if (timeDiff >= 1440) timeStr = `${Math.floor(timeDiff / 1440)} days ago`;

            // Assign color based on action keywords
            let type = 'info';
            const actionLower = log.action.toLowerCase();
            if (actionLower.includes('added') || actionLower.includes('created') || actionLower.includes('approved')) type = 'success';
            if (actionLower.includes('deleted') || actionLower.includes('removed') || actionLower.includes('failed')) type = 'warning';

            return {
                action: log.action,
                user: log.performer?.fullName || log.performer?.username || 'Unknown User',
                time: timeStr,
                type
            };
        });

        if (recentActivities.length === 0) {
            recentActivities = [
                { action: 'System starting up', user: 'System', time: 'Just now', type: 'info' }
            ];
        }

        // 7. Upcoming Events
        const futureAnnouncements = await prisma.announcement.findMany({
            take: 3,
            orderBy: { createdAt: 'desc' }
        });

        let upcomingEvents = futureAnnouncements.map(event => {
            let type = 'info';
            const titleLower = event.title.toLowerCase();
            if (titleLower.includes('exam') || titleLower.includes('test')) type = 'exam';
            if (titleLower.includes('workshop') || titleLower.includes('training')) type = 'workshop';
            if (titleLower.includes('event') || titleLower.includes('holiday')) type = 'event';

            return {
                title: event.title,
                date: new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                type
            };
        });

        // 8. First Year Metrics
        const firstYearStudents = await prisma.student.count({ where: { year: 1, status: 'ACTIVE' } });
        const firstYearSections = await prisma.section.count({ where: { type: 'COMMON' } });
        const coordinator = await prisma.user.findFirst({
            where: { role: 'FIRST_YEAR_COORDINATOR' },
            select: { fullName: true }
        });

        res.json({
            students: studentCount,
            faculty: facultyCount,
            subjects: subjectCount,
            departments: deptCount,
            avgAttendance,
            departmentData,
            performanceTrend,
            marksDistribution,
            attendanceData,
            recentActivities,
            upcomingEvents,
            firstYear: {
                students: firstYearStudents,
                sections: firstYearSections,
                coordinator: coordinator?.fullName || 'Not Assigned'
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching dashboard stats");
    }
};

const exportAttendanceExcel = async (req, res) => {
    const { department, semester, section, subjectId } = req.query;
    try {
        const deptCriteria = await getDeptCriteria(department);

        const where = {
            ...deptCriteria,
            semester: semester ? parseInt(semester) : undefined,
            section: section || undefined
        };

        const students = await prisma.student.findMany({
            where,
            include: {
                attendance: subjectId ? { where: { subjectId: parseInt(subjectId) } } : true
            },
            orderBy: { rollNo: 'asc' }
        });

        let subjectInfo = null;
        if (subjectId) {
            subjectInfo = await prisma.subject.findUnique({
                where: { id: parseInt(subjectId) }
            });
        }

        const excelData = students.map(s => {
            const total = s.attendance.length;
            const presentOnly = s.attendance.filter(a => a.status === 'PRESENT').length;
            const od = s.attendance.filter(a => a.status === 'OD').length;
            const effectivePresent = presentOnly + od;
            const absent = total - effectivePresent;
            const percentage = total > 0 ? ((effectivePresent / total) * 100).toFixed(2) : '0.00';
            const status = parseFloat(percentage) >= 75 ? 'Eligible' : 'Shortage';

            return {
                rollNo: s.rollNo,
                regNo: s.registerNumber || '-',
                name: s.name,
                dept: s.department,
                year: s.year,
                sem: s.semester,
                sec: s.section,
                code: subjectInfo ? subjectInfo.code : 'All',
                subject: subjectInfo ? subjectInfo.name : 'All Subjects',
                total,
                present: presentOnly,
                od,
                absent,
                effective: effectivePresent,
                percentage,
                status
            };
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');
        worksheet.columns = [
            { header: 'Roll No', key: 'rollNo', width: 15 },
            { header: 'Reg No', key: 'regNo', width: 15 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Department', key: 'dept', width: 15 },
            { header: 'Year', key: 'year', width: 8 },
            { header: 'Semester', key: 'sem', width: 10 },
            { header: 'Section', key: 'sec', width: 10 },
            { header: 'Subject Code', key: 'code', width: 15 },
            { header: 'Subject Name', key: 'subject', width: 30 },
            { header: 'Total Classes', key: 'total', width: 15 },
            { header: 'Presents', key: 'present', width: 12 },
            { header: 'OD', key: 'od', width: 10 },
            { header: 'Absents', key: 'absent', width: 12 },
            { header: 'Effective Present', key: 'effective', width: 15 },
            { header: 'Attendance %', key: 'percentage', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        worksheet.addRows(excelData);
        if (excelData.length > 0) {
            worksheet.addRow([]);
            worksheet.addRow(['Note: OD (On Duty) is treated as Present for all attendance calculations.']);
        }

        const filename = `Attendance_Report_${department || 'All'}_${subjectInfo ? subjectInfo.code : 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        handleError(res, error, "Error exporting attendance");
    }
};

module.exports = {
    getDashboardStats,
    exportAttendanceExcel
};
