/**
 * examSheetController.js
 * Exam Attendance Sheet generation per hall + session.
 */
const prisma = require('../lib/prisma');
const pdfService = require('../services/pdf.service.js');
const { logger } = require('../utils/logger');
const { handleError } = require('../utils/errorUtils');

/**
 * GET /api/exam-sheet/generate?examSessionId=1&hallId=2&subjectId=3
 */
exports.generateSheet = async (req, res) => {
    try {
        const { examSessionId, hallId, subjectId, session: allocSession } = req.query;
        if (!examSessionId || !subjectId) {
            return res.status(400).json({ message: 'examSessionId and subjectId are required' });
        }

        const session = await prisma.examSession.findUnique({ 
            where: { id: parseInt(examSessionId) } 
        });
        if (!session) return res.status(404).json({ message: 'Exam session not found' });

        const subject = await prisma.subject.findUnique({ 
            where: { id: parseInt(subjectId) }
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const whereAlloc = {
            examSessionId: parseInt(examSessionId),
            subjectId: parseInt(subjectId)
        };
        if (hallId) {
            whereAlloc.hallId = parseInt(hallId);
        }
        if (allocSession) {
            whereAlloc.session = allocSession;
        }

        const allocations = await prisma.hallAllocation.findMany({
            where: whereAlloc,
            include: {
                hall: true,
                student: {
                    include: {
                        departmentRef: true,
                        dummyMappings: {
                            where: {
                                subjectId: parseInt(subjectId)
                            },
                            take: 1
                        }
                    }
                }
            },
            orderBy: [{ hallId: 'asc' }, { seatNumber: 'asc' }]
        });

        if (allocations.length === 0) {
            return res.status(404).json({ message: 'No allocations found for this selection' });
        }

        // Group by Hall and then by Department
        const byHall = {};

        allocations.forEach(a => {
            const hId = a.hallId;
            // Use full degree + department name from reference if available
            const degree = a.student?.departmentRef?.degree || '';
            const fullDept = a.student?.departmentRef?.name || a.student?.department || 'General';
            const deptName = degree ? `${degree} - ${fullDept}` : fullDept;

            if (!byHall[hId]) {
                byHall[hId] = {
                    hallName: a.hall?.hallName || `Hall ${hId}`,
                    depts: {}
                };
            }

            if (!byHall[hId].depts[deptName]) {
                byHall[hId].depts[deptName] = [];
            }

            byHall[hId].depts[deptName].push({
                seatNumber: a.seatNumber || a.benchIndex || '',
                registerNumber: a.student?.registerNumber || a.student?.rollNo || '',
                dummy: a.student?.dummyMappings?.[0]?.dummyNumber || '',
                name: a.student?.name || '',
                photo: a.student?.photo || null
            });
        });

        const hallsData = Object.values(byHall).map(h => ({
            ...h,
            depts: Object.entries(h.depts).map(([name, entries]) => ({
                deptName: name,
                entries
            }))
        }));

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_sheet_sub_${subjectId}.pdf`);

        const dateStr = session.examDate
            ? new Date(session.examDate).toLocaleDateString('en-IN')
            : (session.month + ' ' + session.year);

        pdfService.generateExamAttendanceSheet(res, {
            subject,
            department: subject.departmentRef?.name || subject.department || '',
            semester: subject.semester || '',
            dateSession: `${dateStr} / ${session.session || 'FN'}`,
            sessionName: session.examName || '',
            halls: hallsData 
        });

        logger.info(`Exam attendance sheet generated for Hall ${hallId}, Subject ${subjectId}`);
    } catch (error) {
        handleError(res, error, "Failed to generate exam attendance sheet");
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
                subjects: { include: { subject: { select: { id: true, code: true, name: true, semester: true } } } }
            }
        });
        res.json(sessions);
    } catch (error) {
        handleError(res, error, "Failed to get exam sessions");
    }
};
