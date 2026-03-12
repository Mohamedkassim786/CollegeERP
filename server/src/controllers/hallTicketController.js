/**
 * hallTicketController.js
 * Hall Ticket generation for end-semester exams.
 * Queries student exam allocations (HallAllocation) and produces PDF.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdf.service.js');
const logger = require('../utils/logger');

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
        const allocations = await prisma.hallAllocation.findMany({
            where: {
                examSessionId: parseInt(examSessionId),
                ...(department ? { student: { department } } : {}),
                ...(semester ? { student: { semester: parseInt(semester) } } : {}),
                ...(section ? { student: { section } } : {}),
            },
            include: {
                student: true,
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
            if (!byStudent[sid]) {
                byStudent[sid] = {
                    ...alloc.student,
                    subjects: []
                };
            }
            byStudent[sid].subjects.push({
                code: alloc.subject?.code,
                name: alloc.subject?.name,
                examDate: examSession.date ? new Date(examSession.date).toLocaleDateString('en-IN') : 'TBD',
                session: examSession.session || 'FN',
                hallNumber: alloc.hall?.name || alloc.hallId?.toString(),
                seatNumber: alloc.seatNumber || ''
            });
        }

        const students = Object.values(byStudent);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=hall_tickets_sem${semester}_${department || 'ALL'}.pdf`);
        pdfService.generateHallTicket(res, { students });

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
