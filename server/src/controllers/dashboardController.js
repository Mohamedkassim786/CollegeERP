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
        // Get department from JWT first, fallback to DB lookup
        let department = req.user.department;
        if (!department) {
            const hod = await prisma.faculty.findUnique({ 
                where: { id: req.user.id },
                select: { department: true }
            });
            department = hod?.department;
        }
        if (!department) {
            return res.status(403).json({ message: "HOD department not identified" });
        }

        const students = await prisma.student.findMany({
            where: { department: department },
            include: {
                results: true,
                attendance: true
            }
        });

        const studentCount = students.length;
        const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
        
        // Average attendance for the department
        const studentIdsInDept = students.map(s => s.id);
        const attendanceRecords = await prisma.studentAttendance.findMany({
            where: { studentId: { in: studentIdsInDept } }
        });
        const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
        const avgAttendance = attendanceRecords.length > 0 ? ((presentCount / attendanceRecords.length) * 100).toFixed(2) : 0;

        // Pending Approvals for this department
        const pendingApprovals = await prisma.marks.count({
            where: {
                student: { department: department },
                isApproved: false,
                isLocked: true // Only count marks that are locked but not yet approved
            }
        });

        res.json({
            studentCount,
            activeStudents,
            avgAttendance,
            pendingApprovals,
            students: students.slice(0, 10).map(s => ({
                id: s.id,
                name: s.name,
                rollNo: s.rollNo,
                year: s.year,
                section: s.section,
                status: s.status
            }))
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
