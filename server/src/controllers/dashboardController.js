const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils.js');

const getPrincipalDashboard = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                students: {
                    include: {
                        results: true
                    }
                }
            }
        });

        const deptStats = departments.map(dept => {
            const studentCount = dept.students.length;
            const passedStudents = dept.students.filter(s => 
                s.results.some(r => r.resultStatus === 'PASS' || r.resultStatus === 'P')
            ).length;
            const passPercentage = studentCount > 0 ? (passedStudents / studentCount * 100).toFixed(2) : 0;

            return {
                name: dept.name,
                code: dept.code,
                studentCount,
                passPercentage
            };
        });

        const totalStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
        const totalArrears = await prisma.arrear.count({ where: { isCleared: false } });

        res.json({
            deptStats,
            overallStats: {
                totalStudents,
                totalArrears
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching Principal dashboard");
    }
};

const getCOEDashboard = async (req, res) => {
    try {
        const activeSessions = await prisma.examSession.findMany({
            include: {
                subjects: {
                    include: {
                        subject: true
                    }
                }
            },
            orderBy: { examDate: 'desc' },
            take: 5
        });

        const pendingMarks = await prisma.marks.count({ where: { isApproved: false } });
        const totalStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });

        res.json({
            activeSessions,
            stats: {
                pendingMarks,
                totalStudents
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching COE dashboard");
    }
};

const getHODDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        let department = req.user.department;
        let departmentId = req.user.departmentId;

        // Fallback for identification if not in JWT
        if (!department || !departmentId) {
            const hod = await prisma.faculty.findUnique({
                where: { id: userId },
                select: { department: true, departmentId: true }
            });
            department = department || hod?.department;
            departmentId = departmentId || hod?.departmentId;
        }

        if (!department && !departmentId) {
            return res.status(403).json({ message: "HOD department not identified" });
        }

        // Use ID-based filtering if available, fallback to string-based for legacy
        const studentWhere = departmentId ? { departmentId } : { department };
        const facultyWhere = departmentId ? { departmentId } : { department };

        const facultyMembers = await prisma.faculty.findMany({
            where: { ...facultyWhere, isActive: true },
            include: { assignments: true }
        });

        const activeStudentCount = await prisma.student.count({
            where: { ...studentWhere, status: 'ACTIVE' }
        });

        // Faculty workload stats
        const facultyWorkload = facultyMembers.map(f => ({
            name: f.fullName,
            count: f.assignments.length,
            id: f.id
        })).sort((a,b) => b.count - a.count).slice(0, 5);

        // Attendance by Year
        const years = [1, 2, 3, 4];
        const attendanceByYear = await Promise.all(years.map(async (year) => {
            const records = await prisma.studentAttendance.findMany({
                where: { 
                    student: { ...studentWhere, year }
                }
            });
            const present = records.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
            const rate = records.length > 0 ? ((present / records.length) * 100).toFixed(1) : 0;
            return { year, rate };
        }));

        // Average attendance for the department
        const totalAttendanceRecords = await prisma.studentAttendance.count({
            where: { student: studentWhere }
        });
        const presentRecords = await prisma.studentAttendance.count({
            where: { 
                student: studentWhere,
                status: { in: ['PRESENT', 'OD'] }
            }
        });
        const avgAttendance = totalAttendanceRecords > 0 ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(1) : 0;

        // Pending Approvals
        const pendingApprovals = await prisma.marks.count({
            where: {
                student: studentWhere,
                isApproved: false,
                isLocked: true
            }
        });

        res.json({
            studentCount: activeStudentCount,
            facultyCount: facultyMembers.length,
            avgAttendance,
            pendingApprovals,
            attendanceByYear,
            facultyWorkload,
            departmentName: department
        });
    } catch (error) {
        handleError(res, error, "Error fetching HOD dashboard");
    }
};

const getStudentDashboard = async (req, res) => {
    try {
        // Find the student linked to this user (assuming username matches rollNo or some mapping)
        const student = await prisma.student.findFirst({
            where: { rollNo: req.user.username }, // Standard mapping in many ERPs
            include: {
                departmentRef: true,
                sectionRef: true,
                results: true,
                marks: {
                    include: {
                        subject: true
                    }
                },
                arrears: {
                    include: {
                        subject: true
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ message: "Student record not found" });

        // Calculate stats
        const attendanceRecords = await prisma.studentAttendance.findMany({
            where: { studentId: student.id }
        });
        const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
        const attendancePercentage = attendanceRecords.length > 0 ? ((presentCount / attendanceRecords.length) * 100).toFixed(2) : 0;

        res.json({
            profile: {
                ...student,
                fullName: student.name // Map for consistency
            },
            stats: {
                attendancePercentage,
                arrearsCount: student.arrears.filter(a => !a.isCleared).length,
                cgpa: student.results.length > 0 ? student.results[student.results.length - 1].cgpa : 0
            },
            recentResults: student.results.sort((a,b) => b.semester - a.semester),
            recentMarks: student.marks.slice(-5)
        });
    } catch (error) {
        handleError(res, error, "Error fetching Student dashboard");
    }
};

const getChiefSecretaryDashboard = async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                students: {
                    where: { status: 'ACTIVE' },
                    include: {
                        results: true
                    }
                }
            }
        });

        const deptStats = departments.map(dept => {
            const studentCount = dept.students.length;
            const passedStudents = dept.students.filter(s => 
                s.results.some(r => r.resultStatus === 'PASS' || r.resultStatus === 'P')
            ).length;
            const passPercentage = studentCount > 0 ? (passedStudents / studentCount * 100).toFixed(1) : 0;

            return {
                name: dept.name,
                code: dept.code,
                studentCount,
                passPercentage
            };
        });

        const totalStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
        const totalFaculty = await prisma.faculty.count({ where: { isActive: true } });
        const pendingApprovals = await prisma.marks.count({ where: { isApproved: false, isLocked: true } });

        res.json({
            deptStats,
            overallStats: {
                totalStudents,
                totalFaculty,
                pendingApprovals
            }
        });
    } catch (error) {
        handleError(res, error, "Error fetching Chief Secretary dashboard");
    }
};

module.exports = {
    getPrincipalDashboard,
    getCOEDashboard,
    getHODDashboard,
    getStudentDashboard,
    getChiefSecretaryDashboard
};
