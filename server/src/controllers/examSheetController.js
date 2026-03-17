/**
 * examSheetController.js
 * Exam Attendance Sheet generation per hall + session.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdf.service.js');
const { logger } = require('../utils/logger');

/**
 * GET /api/exam-sheet/generate?examSessionId=1&hallId=2&subjectId=3
 */
exports.generateSheet = async (req, res) => {
    try {
        const { examSessionId, hallId, subjectId } = req.query;
        if (!examSessionId || !hallId || !subjectId) {
            return res.status(400).json({ message: 'examSessionId, hallId, and subjectId are required' });
        }

        const session = await prisma.examSession.findUnique({ where: { id: parseInt(examSessionId) } });
        if (!session) return res.status(404).json({ message: 'Exam session not found' });

        const hall = await prisma.hall.findUnique({ where: { id: parseInt(hallId) } });
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });

        const allocations = await prisma.hallAllocation.findMany({
            where: {
                examSessionId: parseInt(examSessionId),
                hallId: parseInt(hallId),
                subjectId: parseInt(subjectId)
            },
            include: {
                student: {
                    include: {
                        dummyMappings: {
                            where: {
                                subjectId: parseInt(subjectId),
                                examSessionId: parseInt(examSessionId)
                            },
                            take: 1
                        }
                    }
                }
            },
            orderBy: { seatNumber: 'asc' }
        });

        const entries = allocations.map(a => ({
            seatNumber: a.seatNumber || a.benchIndex || '',
            registerNumber: a.student?.registerNumber || a.student?.rollNo || '',
            dummy: a.student?.dummyMappings?.[0]?.dummyNumber || '',
            name: a.student?.name || ''
        }));

        const dateStr = session.date
            ? new Date(session.date).toLocaleDateString('en-IN')
            : new Date().toLocaleDateString('en-IN');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_sheet_${hall?.name || hallId}_sem${session.semester || ''}.pdf`);

        pdfService.generateExamAttendanceSheet(res, {
            subject,
            department: subject.departmentRef?.name || subject.department || '',
            semester: subject.semester || '',
            hallNumber: hall?.name || `Hall ${hallId}`,
            dateSession: `${dateStr} / ${session.session || 'FN'}`,
            sessionName: session.examName || '',
            entries
        });

        logger.info(`Exam attendance sheet generated for Hall ${hallId}, Subject ${subjectId}`);
    } catch (error) {
        logger.error('generateSheet failed', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/exam-sheet/sessions
 * List available exam sessions (for dropdowns).
 */
exports.getSessions = async (req, res) => {
    try {
        const sessions = await prisma.examSession.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                subjects: { include: { subject: { select: { id: true, code: true, name: true } } } }
            }
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
