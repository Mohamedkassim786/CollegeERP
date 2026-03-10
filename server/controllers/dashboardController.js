const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

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
        const { departmentId } = req.user; // Assuming user model has departmentId for HODs
        if (!departmentId) {
            // Fallback for demo or if not strictly linked
            return res.status(403).json({ message: "HOD department not identified" });
        }

        const students = await prisma.student.findMany({
            where: { departmentId: parseInt(departmentId) },
            include: {
                results: true,
                attendance: true
            }
        });

        const studentCount = students.length;
        const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
        
        // Average attendance for the department
        const attendanceRecords = await prisma.studentAttendance.findMany({
            where: { student: { departmentId: parseInt(departmentId) } }
        });
        const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
        const avgAttendance = attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length * 100).toFixed(2) : 0;

        res.json({
            studentCount,
            activeStudents,
            avgAttendance,
            students: students.slice(0, 10) // Sample of students
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
        const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length * 100).toFixed(2) : 0;

        res.json({
            profile: student,
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

module.exports = {
    getPrincipalDashboard,
    getCOEDashboard,
    getHODDashboard,
    getStudentDashboard
};
