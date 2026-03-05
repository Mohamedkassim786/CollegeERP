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
            // LAB/INTEGRATED: no dummy masking — fetch students from Marks table
            // (These subjects skip dummy mapping and go directly to external staff)
            const marksRecords = await prisma.marks.findMany({
                where: { subjectId: assignment.subjectId },
                include: {
                    student: {
                        select: { id: true, registerNumber: true, name: true, department: true }
                    }
                },
                orderBy: { student: { registerNumber: 'asc' } }
            });

            // Also fetch any already-submitted external marks for this subject
            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: assignment.subjectId }
            });
            // Key by registerNumber since no dummy number
            const extMap = {};
            externalMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

            const resultList = marksRecords.map(m => ({
                dummyNumber: m.student?.registerNumber || '',  // use registerNumber as key
                registerNumber: m.student?.registerNumber || '',
                name: m.student?.name || '',
                department: m.student?.department || '',
                isAbsent: false,
                mark: extMap[m.student?.registerNumber] ?? null
            }));

            return res.json({
                subject: assignment.subject.name,
                subjectCode: assignment.subject.code,
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

                // Only update dummy mapping for THEORY subjects (LAB/INTEGRATED skip dummy mapping)
                if (category === 'THEORY') {
                    await tx.subjectDummyMapping.updateMany({
                        where: { dummyNumber, subjectId: subjectInt },
                        data: { marks: raw }
                    });
                }

                // For LAB/INTEGRATED: dummyNumber holds the register number (unique key per subject)
                await tx.externalMark.upsert({
                    where: {
                        subjectId_dummyNumber: {
                            subjectId: subjectInt,
                            dummyNumber
                        }
                    },
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

// ─── Admin: Submit external marks directly (bypasses staff assignment) ─────────
exports.submitMarksAdmin = async (req, res) => {
    try {
        const { subjectId, marks } = req.body; // marks = [{ dummyNumber, rawMark }]

        if (!Array.isArray(marks) || !subjectId) {
            return res.status(400).json({ message: 'subjectId and marks array required' });
        }

        const subjectInt = parseInt(subjectId);
        const subject = await prisma.subject.findUnique({ where: { id: subjectInt } });
        const category = subject?.subjectCategory || 'THEORY';

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { dummyNumber, rawMark } = entry;
                const raw = parseFloat(rawMark);
                if (isNaN(raw) || raw < 0) continue;

                const maxAllowed = category === 'LAB' ? 40 : category === 'INTEGRATED' ? 50 : 60;
                if (raw > maxAllowed) continue;

                const converted60 = category === 'THEORY' ? raw : raw; // already in correct scale

                if (category === 'THEORY') {
                    await tx.subjectDummyMapping.updateMany({
                        where: { dummyNumber, subjectId: subjectInt },
                        data: { marks: raw }
                    });
                }

                await tx.externalMark.upsert({
                    where: {
                        subjectId_dummyNumber: {
                            subjectId: subjectInt,
                            dummyNumber
                        }
                    },
                    update: {
                        rawExternal100: raw,
                        convertedExternal60: converted60,
                        submittedBy: req.user.id,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        rawExternal100: raw,
                        convertedExternal60: converted60,
                        submittedBy: req.user.id,
                        isApproved: true
                    }
                });
            }
        });

        res.json({ message: `External marks saved for ${marks.length} student(s)`, subjectCategory: category });
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

        let entries = [];

        if (category === 'LAB' || category === 'INTEGRATED') {
            // LAB/INTEGRATED: no dummy mapping — use externalMark records keyed by registerNumber
            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: subIdInt },
                orderBy: { dummyNumber: 'asc' }
            });

            // Fetch all students who have marks for this subject (for name/dept lookup)
            const marksRecords = await prisma.marks.findMany({
                where: { subjectId: subIdInt },
                include: {
                    student: { select: { registerNumber: true, name: true, department: true } }
                }
            });
            const studentMap = {};
            marksRecords.forEach(m => {
                if (m.student) studentMap[m.student.registerNumber] = m.student;
            });

            entries = externalMarks.map(em => {
                const stu = studentMap[em.dummyNumber] || {};
                return {
                    dummyNumber: em.dummyNumber,   // registerNumber used as key
                    registerNumber: em.dummyNumber,
                    name: stu.name || '',
                    department: stu.department || subject.department || '',
                    marks: em.rawExternal100
                };
            });
        } else {
            // THEORY: use dummy mappings
            const mappings = await prisma.subjectDummyMapping.findMany({
                where: { subjectId: subIdInt, mappingLocked: true },
                include: {
                    student: { select: { registerNumber: true, name: true, department: true } }
                },
                orderBy: { dummyNumber: 'asc' }
            });
            entries = mappings.map(m => ({
                dummyNumber: m.dummyNumber,
                registerNumber: m.student?.registerNumber || '',
                department: m.student?.department || '',
                marks: m.marks
            }));
        }

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
