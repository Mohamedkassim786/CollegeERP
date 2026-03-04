const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdfService');

// ─── Get dummy list for external staff ───────────────────────────────────────
exports.getAssignedDummyList = async (req, res) => {
    try {
        if (req.user.role !== 'EXTERNAL_STAFF') {
            return res.status(403).json({ message: "Access denied. Only external staff can enter marks." });
        }

        const staffId = req.user.id;
        const { assignmentId } = req.params;

        const assignment = await prisma.externalMarkAssignment.findUnique({
            where: { id: parseInt(assignmentId) },
            include: { subject: true }
        });

        if (!assignment || assignment.staffId !== staffId) {
            return res.status(403).json({ message: "Unauthorized access to this assignment" });
        }

        const category = assignment.subject?.subjectCategory || 'THEORY';

        if (category === 'LAB' || category === 'INTEGRATED') {
            // For LAB: return actual register numbers (not dummy)
            const mappings = await prisma.subjectDummyMapping.findMany({
                where: { subjectId: assignment.subjectId, mappingLocked: true },
                include: { student: { select: { registerNumber: true, name: true, department: true } } },
                orderBy: { dummyNumber: 'asc' }
            });

            const resultList = mappings.map(m => ({
                dummyNumber: m.dummyNumber,
                registerNumber: m.student?.registerNumber || '',
                name: m.student?.name || '',
                department: m.student?.department || '',
                isAbsent: m.isAbsent,
                mark: m.marks
            }));

            return res.json({
                subject: assignment.subject.name,
                subjectId: assignment.subjectId,
                subjectCategory: category,
                deadline: assignment.deadline,
                dummyList: resultList
            });
        }

        // THEORY: return dummy numbers only
        const mappings = await prisma.subjectDummyMapping.findMany({
            where: { subjectId: assignment.subjectId, mappingLocked: true, isAbsent: false },
            select: { dummyNumber: true, marks: true },
            orderBy: { dummyNumber: 'asc' }
        });

        res.json({
            subject: assignment.subject.name,
            subjectId: assignment.subjectId,
            subjectCategory: category,
            deadline: assignment.deadline,
            dummyList: mappings.map(m => ({ dummyNumber: m.dummyNumber, mark: m.marks }))
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Submit marks + return PDF ────────────────────────────────────────────────
exports.submitMarks = async (req, res) => {
    try {
        if (req.user.role !== 'EXTERNAL_STAFF') {
            return res.status(403).json({ message: "Access denied. Only external staff can submit marks." });
        }

        const staffId = req.user.id;
        const { subjectId, marks } = req.body; // marks = [{ dummyNumber, rawMark }]

        if (!Array.isArray(marks)) {
            return res.status(400).json({ message: "Invalid marks format" });
        }

        const subjectInt = parseInt(subjectId);

        // Fetch subject to determine category
        const subject = await prisma.subject.findUnique({ where: { id: subjectInt } });
        const category = subject?.subjectCategory || 'THEORY';

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { dummyNumber, rawMark } = entry;
                const raw = parseFloat(rawMark);
                if (isNaN(raw) || raw < 0) continue;

                // Max allowed differs by category
                const maxAllowed = category === 'LAB' ? 40 : category === 'INTEGRATED' ? 50 : 100;
                if (raw > maxAllowed) continue;

                const converted60 = category === 'THEORY' ? (raw / 100) * 60 : raw;

                await tx.subjectDummyMapping.updateMany({
                    where: { dummyNumber, subjectId: subjectInt },
                    data: { marks: raw }
                });

                await tx.externalMark.upsert({
                    where: { dummyNumber },
                    update: {
                        rawExternal100: raw,
                        convertedExternal60: converted60,
                        submittedBy: staffId,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        rawExternal100: raw,
                        convertedExternal60: converted60,
                        submittedBy: staffId,
                        isApproved: true
                    }
                });
            }

            await tx.externalMarkAssignment.updateMany({
                where: { staffId, subjectId: subjectInt, status: 'PENDING' },
                data: { status: 'COMPLETED' }
            });
        });

        res.json({ message: "Marks submitted successfully", count: marks.length, subjectCategory: category });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Generate Statement of Marks PDF ─────────────────────────────────────────
exports.generateStatementPDF = async (req, res) => {
    try {
        const { subjectId, dateSession, qpCode, packetNo } = req.query;
        const subIdInt = parseInt(subjectId);

        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const category = subject.subjectCategory || 'THEORY';

        // Fetch all dummy mappings for this subject
        const mappings = await prisma.subjectDummyMapping.findMany({
            where: { subjectId: subIdInt, mappingLocked: true },
            include: {
                student: { select: { registerNumber: true, name: true, department: true } }
            },
            orderBy: { dummyNumber: 'asc' }
        });

        // Build entries list
        const entries = mappings.map(m => ({
            dummyNumber: m.dummyNumber,
            registerNumber: m.student?.registerNumber || '',
            department: m.student?.department || '',
            marks: m.marks
        }));

        const filename = `Statement_${subject.code}_${category}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        if (category === 'LAB' || category === 'INTEGRATED') {
            pdfService.generateLabStatementOfMarks(res, {
                subject,
                entries,
                dateSession: dateSession || '',
                department: subject.department || ''
            });
        } else {
            pdfService.generateTheoryStatementOfMarks(res, {
                subject,
                entries,
                dateSession: dateSession || '',
                qpCode: qpCode || '',
                packetNo: packetNo || '',
                boardName: ''
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
