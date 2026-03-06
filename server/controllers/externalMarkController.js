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

        if (category === 'LAB') {
            // Pure LAB: no dummy masking — fetch students from Marks table
            // External examiner enters /100, converted to /40 in display/calc
            const marksRecords = await prisma.marks.findMany({
                where: { subjectId: assignment.subjectId },
                include: {
                    student: {
                        select: { id: true, registerNumber: true, name: true, department: true }
                    }
                },
                orderBy: { student: { registerNumber: 'asc' } }
            });

            // Fetch any already-submitted external marks for this subject
            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: assignment.subjectId, component: 'THEORY' }
            });
            const extMap = {};
            externalMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

            const resultList = marksRecords.map(m => ({
                dummyNumber: m.student?.registerNumber || '',
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
                component: 'THEORY',
                maxMark: 100,
                convertedMax: 40,
                deadline: assignment.deadline,
                dummyList: resultList
            });
        }

        if (category === 'INTEGRATED') {
            // INTEGRATED: external has TWO components — THEORY (via dummies) and LAB (via register number)
            // Determine which component is being requested (default to assigned component)
            const component = req.query.component || assignment.component || 'THEORY';

            if (component === 'LAB') {
                // LAB component: show register numbers + names, max 100 (converts to 25)
                const marksRecords = await prisma.marks.findMany({
                    where: { subjectId: assignment.subjectId },
                    include: {
                        student: {
                            select: { id: true, registerNumber: true, name: true, department: true }
                        }
                    },
                    orderBy: { student: { registerNumber: 'asc' } }
                });

                const externalMarks = await prisma.externalMark.findMany({
                    where: { subjectId: assignment.subjectId, component: 'LAB' }
                });
                const extMap = {};
                externalMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

                const resultList = marksRecords.map(m => ({
                    dummyNumber: m.student?.registerNumber || '',
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
                    component: 'LAB',
                    maxMark: 25,
                    convertedMax: 25,
                    deadline: assignment.deadline,
                    dummyList: resultList
                });
            }

            // THEORY component: show dummy numbers (anonymous), max 100 (converts to 25)
            const mappings = await prisma.subjectDummyMapping.findMany({
                where: { subjectId: assignment.subjectId, mappingLocked: true, isAbsent: false },
                select: { dummyNumber: true },
                orderBy: { dummyNumber: 'asc' }
            });

            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: assignment.subjectId, component: 'THEORY' }
            });
            const extMap = {};
            externalMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

            return res.json({
                subject: assignment.subject.name,
                subjectCode: assignment.subject.code,
                subjectId: assignment.subjectId,
                subjectCategory: category,
                component: 'THEORY',
                maxMark: 25,
                convertedMax: 25,
                deadline: assignment.deadline,
                dummyList: mappings.map(m => ({ dummyNumber: m.dummyNumber, mark: extMap[m.dummyNumber] ?? null }))
            });
        }

        // THEORY: return dummy numbers only, max 100 (converts to 60)
        const mappings = await prisma.subjectDummyMapping.findMany({
            where: { subjectId: assignment.subjectId, mappingLocked: true, isAbsent: false },
            select: { dummyNumber: true, marks: true },
            orderBy: { dummyNumber: 'asc' }
        });

        const existingExtMarks = await prisma.externalMark.findMany({
            where: { subjectId: assignment.subjectId, component: 'THEORY' }
        });
        const extMap = {};
        existingExtMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

        res.json({
            subject: assignment.subject.name,
            subjectCode: assignment.subject.code,
            subjectId: assignment.subjectId,
            subjectCategory: category,
            component: 'THEORY',
            maxMark: 60,
            convertedMax: 60,
            deadline: assignment.deadline,
            dummyList: mappings.map(m => ({ dummyNumber: m.dummyNumber, mark: extMap[m.dummyNumber] ?? m.marks }))
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
        // component: 'THEORY' | 'LAB' — for INTEGRATED subjects only. Ignored for pure THEORY/LAB.
        const { subjectId, marks, component: reqComponent } = req.body;

        if (!Array.isArray(marks)) {
            return res.status(400).json({ message: "Invalid marks format" });
        }

        const subjectInt = parseInt(subjectId);
        const subject = await prisma.subject.findUnique({ where: { id: subjectInt } });
        const category = subject?.subjectCategory || 'THEORY';

        // Determine the component tag and conversion factor
        // THEORY:     raw/100 → stored, converted = raw/100*60
        // LAB:        raw/100 → converted = raw/100*40
        // INTEGRATED THEORY component: raw/100 → converted = raw/100*25
        // INTEGRATED LAB component:    raw/100 → converted = raw/100*25
        let component = 'THEORY';
        let convertFactor = 60; // used for THEORY and INTEGRATED THEORY
        if (category === 'LAB') {
            component = 'THEORY'; // pure LAB only has one external component, tagged THEORY
            convertFactor = 40;
        } else if (category === 'INTEGRATED') {
            component = reqComponent === 'LAB' ? 'LAB' : 'THEORY';
            convertFactor = 25; // both INTEGRATED components /100 → /25
        }
        // For pure THEORY: component='THEORY', convertFactor=60

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { dummyNumber, rawMark } = entry;
                const raw = parseFloat(rawMark);
                if (isNaN(raw) || raw < 0 || raw > convertFactor) continue;

                const converted = raw;

                // Mirror raw mark into SubjectDummyMapping for THEORY external of THEORY/INTEGRATED subjects
                if ((category === 'THEORY' || (category === 'INTEGRATED' && component === 'THEORY'))) {
                    await tx.subjectDummyMapping.updateMany({
                        where: { dummyNumber, subjectId: subjectInt },
                        data: { marks: raw }
                    });
                }

                await tx.externalMark.upsert({
                    where: {
                        subjectId_dummyNumber_component: {
                            subjectId: subjectInt,
                            dummyNumber,
                            component
                        }
                    },
                    update: {
                        rawExternal100: raw,
                        convertedExternal60: converted,
                        submittedBy: staffId,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        component,
                        rawExternal100: raw,
                        convertedExternal60: converted,
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

        res.json({ message: "Marks submitted successfully", count: marks.length, subjectCategory: category, component });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Admin: Submit external marks directly (bypasses staff assignment) ─────────
exports.submitMarksAdmin = async (req, res) => {
    try {
        // component: 'THEORY' | 'LAB' — relevant only for INTEGRATED subjects
        const { subjectId, marks, component: reqComponent } = req.body;

        if (!Array.isArray(marks) || !subjectId) {
            return res.status(400).json({ message: 'subjectId and marks array required' });
        }

        const subjectInt = parseInt(subjectId);
        const subject = await prisma.subject.findUnique({ where: { id: subjectInt } });
        const category = subject?.subjectCategory || 'THEORY';

        // Same conversion logic as submitMarks
        // THEORY: /100 → /60, LAB: /100 → /40, INTEGRATED THEORY: /100 → /25, INTEGRATED LAB: /100 → /25
        let component = 'THEORY';
        let convertFactor = 60;
        if (category === 'LAB') {
            component = 'THEORY';
            convertFactor = 40;
        } else if (category === 'INTEGRATED') {
            component = reqComponent === 'LAB' ? 'LAB' : 'THEORY';
            convertFactor = 25;
        }

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { dummyNumber, rawMark } = entry;
                const raw = parseFloat(rawMark);
                if (isNaN(raw) || raw < 0 || raw > convertFactor) continue;

                const converted = raw;

                if (category === 'THEORY' || (category === 'INTEGRATED' && component === 'THEORY')) {
                    await tx.subjectDummyMapping.updateMany({
                        where: { dummyNumber, subjectId: subjectInt },
                        data: { marks: raw }
                    });
                }

                await tx.externalMark.upsert({
                    where: {
                        subjectId_dummyNumber_component: {
                            subjectId: subjectInt,
                            dummyNumber,
                            component
                        }
                    },
                    update: {
                        rawExternal100: raw,
                        convertedExternal60: converted,
                        submittedBy: req.user.id,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        component,
                        rawExternal100: raw,
                        convertedExternal60: converted,
                        submittedBy: req.user.id,
                        isApproved: true
                    }
                });
            }
        });

        res.json({ message: `External marks saved for ${marks.length} student(s)`, subjectCategory: category, component });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Generate Statement of Marks PDF ─────────────────────────────────────────
exports.generateStatementPDF = async (req, res) => {
    try {
        const { subjectId, dateSession, qpCode, packetNo, component } = req.query;
        const subIdInt = parseInt(subjectId);

        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const category = subject.subjectCategory || 'THEORY';
        // For INTEGRATED: component query param decides which PDF to generate
        // component='THEORY' → Theory Statement (dummy numbers)
        // component='LAB'    → Lab Statement (register numbers)
        const pdfComponent = (category === 'INTEGRATED') ? (component || 'THEORY') : null;

        let entries = [];

        if (category === 'LAB' || (category === 'INTEGRATED' && pdfComponent === 'LAB')) {
            // LAB-type: use externalMark records keyed by registerNumber (component=LAB for INTEGRATED)
            const whereFilter = category === 'LAB'
                ? { subjectId: subIdInt }
                : { subjectId: subIdInt, component: 'LAB' };

            const externalMarks = await prisma.externalMark.findMany({
                where: whereFilter,
                orderBy: { dummyNumber: 'asc' }  // dummyNumber = registerNumber for LAB
            });

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
                    registerNumber: em.dummyNumber,
                    name: stu.name || '',
                    department: stu.department || subject.department || '',
                    marks: em.rawExternal100
                };
            });
        } else {
            // THEORY or INTEGRATED THEORY component: use dummy mappings
            const whereFilter = category === 'INTEGRATED'
                ? { subjectId: subIdInt, mappingLocked: true, component: 'THEORY' }  // only theory-mapped
                : { subjectId: subIdInt, mappingLocked: true };

            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: subIdInt, component: 'THEORY' },
                orderBy: { dummyNumber: 'asc' }
            });
            const extMap = {};
            externalMarks.forEach(em => { extMap[em.dummyNumber] = em.rawExternal100; });

            const mappings = await prisma.subjectDummyMapping.findMany({
                where: { subjectId: subIdInt, mappingLocked: true },
                include: { student: { select: { registerNumber: true, name: true, department: true } } },
                orderBy: { dummyNumber: 'asc' }
            });
            entries = mappings.map(m => ({
                dummyNumber: m.dummyNumber,
                registerNumber: m.student?.registerNumber || '',
                department: m.student?.department || '',
                marks: extMap[m.dummyNumber] ?? m.marks ?? null
            }));
        }

        const compLabel = pdfComponent ? `_${pdfComponent}` : '';
        const filename = `Statement_${subject.code}${compLabel}_${category}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        if (category === 'LAB' || (category === 'INTEGRATED' && pdfComponent === 'LAB')) {
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
                packetNoBase: parseInt(packetNo) || 1,
                examTitle: `END SEMESTER ${category === 'INTEGRATED' ? 'THEORY ' : ''}EXAMINATIONS NOV/DEC ${new Date().getFullYear()}`,
                boardName: subject.boardName || ''
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
