/**
 * hallTicketController.js
 * Hall Ticket generation for end-semester exams.
 * Queries student exam allocations (HallAllocation) and produces PDF.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdf.service.js');
const { logger } = require('../utils/logger');

/**
 * GET /api/hall-ticket/generate?department=CSE&semester=4&section=A&examSessionId=1
 * Generates hall tickets for all students in a given exam session.
 */
exports.generateHallTickets = async (req, res) => {
    try {
        const { department, semester, section, examSessionId } = req.query;
        if (!examSessionId) {
            return res.status(400).json({ message: 'examSessionId is required' });
        }

        // Get exam session with subjects
        const examSession = await prisma.examSession.findUnique({
            where: { id: parseInt(examSessionId) },
            include: {
                subjects: { include: { subject: true } }
            }
        });
        if (!examSession) return res.status(404).json({ message: 'Exam session not found' });

        // Get hall allocations for this session
        const where = { examSessionId: parseInt(examSessionId) };
        const andConditions = [];
        if (department) {
            andConditions.push({
                OR: [
                    { department: department },
                    { student: { department: department } },
                    { student: { departmentRef: { code: department } } },
                    { student: { departmentRef: { name: department } } }
                ]
            });
        }
        if (semester) {
            andConditions.push({
                OR: [
                    { student: { semester: parseInt(semester) } },
                    { student: { currentSemester: parseInt(semester) } }
                ]
            });
        }
        if (section) {
            andConditions.push({
                OR: [
                    { student: { section: section } },
                    { student: { sectionRef: { name: section } } }
                ]
            });
        }
        if (andConditions.length > 0) where.AND = andConditions;

        const allocations = await prisma.hallAllocation.findMany({
            where,
            include: {
                student: {
                    include: { 
                        departmentRef: true,
                        eligibility: {
                            where: { semester: parseInt(semester) || undefined }
                        }
                    }
                },
                hall: true,
                subject: true
            },
            orderBy: [{ student: { rollNo: 'asc' } }, { seatNumber: 'asc' }]
        });

        if (!allocations.length) {
            return res.status(404).json({ message: 'No hall allocations found for this session.' });
        }

        // Group allocations by student
        const byStudent = {};
        for (const alloc of allocations) {
            const sid = alloc.studentId;
            const student = alloc.student;
            const subject = alloc.subject;

            // Enforcement of Attendance Eligibility (SA Check)
            const eligibility = student.eligibility?.find(e => e.subjectId === subject.id);
            if (eligibility && eligibility.status === 'DETAINED' && !eligibility.isException) {
                logger.warn(`Skipping Hall Ticket for Student ${student.rollNo}, Subject ${subject.code} - DETAINED (No Exception)`);
                continue;
            }

            // Find specific date for this subject in this session
            const sessionSubject = examSession.subjects.find(s => s.subjectId === subject.id);
            const rawDate = sessionSubject?.examDate || examSession.examDate || examSession.date || Date.now();
            const formattedDate = new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

            if (!byStudent[sid]) {
                byStudent[sid] = {
                    ...student,
                    subjects: []
                };
            }
            byStudent[sid].subjects.push({
                code: subject?.code,
                name: subject?.name,
                subjectCategory: subject?.subjectCategory || 'THEORY',
                semester: subject?.semester,
                examDate: formattedDate,
                session: examSession.session || 'FN',
                hallNumber: alloc.hall?.hallName || alloc.hall?.name || '',
                seatNumber: alloc.seatNumber || ''
            });
        }

        const students = Object.values(byStudent);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=hall_tickets_sem${semester}_${department || 'ALL'}.pdf`);
        
        // Use month/year from session if available for the session name/header
        const headerTitle = examSession.month && examSession.year 
            ? `(${examSession.month} ${examSession.year})`
            : examSession.examName || '';
            
        pdfService.generateHallTicket(res, { students, sessionName: headerTitle });

        logger.info(`Hall tickets generated for ${students.length} students — Session ${examSessionId}`);
    } catch (error) {
        logger.error('generateHallTickets failed', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/hall-ticket/status?examSessionId=1
 * Returns hall allocation status summary for an exam session.
 */
exports.getHallTicketStatus = async (req, res) => {
    try {
        const { examSessionId } = req.query;
        const sessionId = parseInt(examSessionId);

        const [session, allocCount, studentCount] = await Promise.all([
            prisma.examSession.findUnique({
                where: { id: sessionId },
                include: { subjects: { include: { subject: { select: { code: true, name: true } } } } }
            }),
            prisma.hallAllocation.count({ where: { examSessionId: sessionId } }),
            prisma.hallAllocation.findMany({
                where: { examSessionId: sessionId },
                distinct: ['studentId']
            }).then(r => r.length)
        ]);

        res.json({
            session,
            totalAllocations: allocCount,
            totalStudents: studentCount,
            isReady: allocCount > 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateHallApplication = async (req, res) => {
    try {
        const { department, semester, section, examSessionId } = req.query;
        if (!examSessionId) return res.status(400).json({ message: 'examSessionId is required' });

        const examSession = await prisma.examSession.findUnique({
            where: { id: parseInt(examSessionId) },
            include: { subjects: { include: { subject: true } } }
        });
        if (!examSession) return res.status(404).json({ message: 'Exam session not found' });

        const whereS = { status: 'ACTIVE' };
        const andS = [];
        if (department) {
            andS.push({
                OR: [
                    { department: department },
                    { departmentRef: { code: department } },
                    { departmentRef: { name: department } }
                ]
            });
        }
        if (semester) {
            andS.push({
                OR: [
                    { semester: parseInt(semester) },
                    { currentSemester: parseInt(semester) }
                ]
            });
        }
        if (section) {
            andS.push({
                OR: [
                    { section: section },
                    { sectionRef: { name: section } }
                ]
            });
        }
        if (andS.length > 0) whereS.AND = andS;

        const students = await prisma.student.findMany({
            where: whereS,
            include: {
                departmentRef: true,
                marks: {
                    include: { subject: true }
                },
                arrears: {
                    where: { isCleared: false },
                    include: { subject: true }
                },
                eligibility: {
                    where: { semester: parseInt(semester) }
                }
            },
            orderBy: { rollNo: 'asc' }
        });

        if (!students.length) return res.status(404).json({ message: 'No students found.' });

        const studentData = students.map(s => {
            const currentSubjects = s.marks
                .filter(m => {
                    // Filter out DETAINED subjects without exception
                    const eligibility = s.eligibility?.find(e => e.subjectId === m.subjectId);
                    if (eligibility && eligibility.status === 'DETAINED' && !eligibility.isException) {
                        return false;
                    }
                    return true;
                })
                .map(m => ({
                    code: m.subject?.code,
                    name: m.subject?.name,
                    subjectCategory: m.subject?.subjectCategory || 'THEORY',
                    semester: m.subject?.semester,
                    isArrear: false
                }));

            const arrearSubjects = s.arrears.map(a => ({
                code: a.subject?.code,
                name: a.subject?.name,
                subjectCategory: a.subject?.subjectCategory || 'THEORY',
                semester: a.subject?.semester,
                isArrear: true
            }));

            return {
                ...s,
                subjects: [...currentSubjects, ...arrearSubjects]
            };
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=hall_application_sem${semester}_${department || 'ALL'}.pdf`);
        const sessionName = examSession.month && examSession.year 
            ? `${examSession.month} - ${examSession.year}`
            : examSession.examName || '';

        pdfService.generateHallApplication(res, { students: studentData, sessionName });

    } catch (error) {
        logger.error('generateHallApplication failed', error);
        res.status(500).json({ message: error.message });
    }
};
