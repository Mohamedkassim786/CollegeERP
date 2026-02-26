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

        res.json({
            students: studentCount,
            faculty: facultyCount,
            subjects: subjectCount,
            departments: deptCount
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
