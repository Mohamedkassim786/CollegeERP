const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdf.service.js');

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
        existingExtMarks.forEach(em => { 
            const key = (em.dummyNumber || '').trim();
            extMap[key] = em.rawExternal100; 
        });

        res.json({
            subject: assignment.subject.name,
            subjectCode: assignment.subject.code,
            subjectId: assignment.subjectId,
            subjectCategory: category,
            component: 'THEORY',
            maxMark: 60,
            convertedMax: 60,
            deadline: assignment.deadline,
            dummyList: mappings.map(m => {
                const dNo = (m.dummyNumber || '').trim();
                return { dummyNumber: dNo, mark: extMap[dNo] ?? m.marks };
            })
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
        const { subjectId, marks, component: reqComponent } = req.body;

        if (!Array.isArray(marks)) {
            return res.status(400).json({ message: "Invalid marks format" });
        }

        const subjectInt = parseInt(subjectId);
        const subject = await prisma.subject.findUnique({ where: { id: subjectInt } });
        if (!subject) return res.status(404).json({ message: "Subject not found" });
        const category = subject?.subjectCategory || 'THEORY';

        let component = 'THEORY';
        if (category === 'LAB') {
            component = 'THEORY';
        } else if (category === 'INTEGRATED') {
            component = reqComponent === 'LAB' ? 'LAB' : 'THEORY';
        }

        let savedCount = 0;
        const errors = [];

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { rawMark } = entry;
                const dummyNumber = (entry.dummyNumber || '').toString().trim();
                
                if (!dummyNumber) {
                    errors.push(`Empty dummy number for entry`);
                    continue;
                }

                const raw = parseFloat(rawMark);
                if (isNaN(raw)) {
                    errors.push(`Invalid mark for dummy ${dummyNumber}`);
                    continue;
                }
                
                if (raw < 0 || raw > 100) {
                    errors.push(`Mark ${raw} out of range [0-100] for dummy ${dummyNumber}`);
                    continue;
                }

                if (category === 'THEORY' || (category === 'INTEGRATED' && component === 'THEORY')) {
                    await tx.subjectDummyMapping.updateMany({
                        where: { 
                            dummyNumber, 
                            subjectId: subjectInt 
                        },
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
                        convertedExternal60: raw,
                        submittedBy: staffId,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        component,
                        rawExternal100: raw,
                        convertedExternal60: raw,
                        submittedBy: staffId,
                        isApproved: true
                    }
                });
                savedCount++;
            }

            if (savedCount > 0) {
                await tx.externalMarkAssignment.updateMany({
                    where: { staffId, subjectId: subjectInt, status: 'PENDING' },
                    data: { status: 'COMPLETED' }
                });
            }
        });

        res.json({ 
            message: savedCount > 0 ? "Marks submitted successfully" : "No marks were saved", 
            count: savedCount, 
            totalSent: marks.length,
            errors: errors.length > 0 ? errors : undefined,
            subjectCategory: category, 
            component 
        });

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

        let savedCount = 0;
        const errors = [];

        await prisma.$transaction(async (tx) => {
            for (const entry of marks) {
                const { rawMark } = entry;
                const dummyNumber = (entry.dummyNumber || '').toString().trim();
                
                if (!dummyNumber) {
                    errors.push(`Empty dummy number for entry`);
                    continue;
                }

                const raw = parseFloat(rawMark);
                if (isNaN(raw)) {
                    errors.push(`Invalid mark for dummy ${dummyNumber}`);
                    continue;
                }
                
                if (raw < 0 || raw > 100) {
                    errors.push(`Mark ${raw} out of range [0-100] for dummy ${dummyNumber}`);
                    continue;
                }

                if (category === 'THEORY' || (category === 'INTEGRATED' && component === 'THEORY')) {
                    await tx.subjectDummyMapping.updateMany({
                        where: { 
                            dummyNumber, 
                            subjectId: subjectInt 
                        },
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
                        convertedExternal60: raw,
                        submittedBy: req.user.id,
                        submittedAt: new Date(),
                        isApproved: true
                    },
                    create: {
                        subjectId: subjectInt,
                        dummyNumber,
                        component,
                        rawExternal100: raw,
                        convertedExternal60: raw,
                        submittedBy: req.user.id,
                        isApproved: true
                    }
                });
                savedCount++;
            }
        });

        res.json({ 
            message: savedCount > 0 ? `External marks saved for ${savedCount} student(s)` : "No marks were saved", 
            count: savedCount, 
            totalSent: marks.length,
            errors: errors.length > 0 ? errors : undefined,
            subjectCategory: category, 
            component 
        });
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

        // Fetch Exam Session month/year from Hall Allocation / ExamSession
        let autoDateSession = '';
        let examMonthYear = '';
        const allocation = await prisma.hallAllocation.findFirst({
            where: { subjectId: subIdInt },
            select: { 
                examDate: true, 
                session: true,
                examSession: { select: { month: true, year: true } }
            }
        });
        
        if (allocation) {
            if (allocation.examDate) {
                const dateStr = new Date(allocation.examDate).toLocaleDateString('en-GB');
                autoDateSession = `${dateStr} ${allocation.session || ''}`;
            }
            if (allocation.examSession) {
                const month = allocation.examSession.month || '';
                const year = allocation.examSession.year || '';
                if (month || year) examMonthYear = `${month} ${year}`.trim();
            }
        }
        const finalDateSession = dateSession || autoDateSession;

        const category = subject.subjectCategory || 'THEORY';
        const pdfComponent = (category === 'INTEGRATED') ? (component || 'THEORY') : null;

        let entries = [];

        if (category === 'LAB' || (category === 'INTEGRATED' && pdfComponent === 'LAB')) {
            const whereFilter = category === 'LAB'
                ? { subjectId: subIdInt }
                : { subjectId: subIdInt, component: 'LAB' };

            const externalMarks = await prisma.externalMark.findMany({
                where: whereFilter
            });
            const extMap = {};
            externalMarks.forEach(em => { 
                const key = (em.dummyNumber || '').trim();
                extMap[key] = em.rawExternal100; 
            });

            const endSemMarks = await prisma.endSemMarks.findMany({
                where: { marks: { subjectId: subIdInt } },
                include: { marks: { select: { student: { select: { registerNumber: true } } } } }
            });
            const endSemMap = {};
            endSemMarks.forEach(esm => {
                const regNo = (esm.marks?.student?.registerNumber || '').trim();
                if (regNo) endSemMap[regNo] = esm.externalMarks;
            });

            const marksRecords = await prisma.marks.findMany({
                where: { subjectId: subIdInt },
                include: {
                    student: { 
                        select: { id: true, registerNumber: true, name: true, department: true },
                    }
                },
                orderBy: { student: { registerNumber: 'asc' } }
            });

            entries = marksRecords.map(m => {
                const regNo = (m.student?.registerNumber || '').trim();
                return {
                    registerNumber: regNo,
                    name: m.student?.name || '',
                    department: m.student?.department || subject.department || 'Unknown',
                    marks: extMap[regNo] ?? endSemMap[regNo] ?? null
                };
            });
        } else {
            // For THEORY: check ExternalMark (component: THEORY), SubjectDummyMapping.marks, and EndSemMarks
            const externalMarks = await prisma.externalMark.findMany({
                where: { subjectId: subIdInt, component: 'THEORY' }
            });
            const extMap = {};
            externalMarks.forEach(em => { 
                const key = (em.dummyNumber || '').trim();
                extMap[key] = em.rawExternal100; 
            });

            const mappings = await prisma.subjectDummyMapping.findMany({
                where: { subjectId: subIdInt, mappingLocked: true },
                include: { student: { select: { id: true, registerNumber: true, name: true, department: true } } },
                orderBy: { dummyNumber: 'asc' }
            });

            const endSemMarks = await prisma.endSemMarks.findMany({
                where: { marks: { subjectId: subIdInt } },
                include: { marks: { select: { studentId: true } } }
            });
            const endSemMap = {};
            endSemMarks.forEach(esm => {
                if (esm.marks?.studentId) endSemMap[esm.marks.studentId] = esm.externalMarks;
            });

            entries = mappings.map(m => {
                const dNo = (m.dummyNumber || '').trim();
                const studentId = m.student?.id;
                return {
                    dummyNumber: dNo,
                    registerNumber: m.student?.registerNumber || '',
                    name: m.student?.name || '',
                    department: m.student?.department || subject.department || 'Unknown',
                    marks: extMap[dNo] ?? m.marks ?? (studentId ? endSemMap[studentId] : null) ?? null
                };
            });
        }

        // --- Grouping by Department and Fetching Names ---
        const departments = await prisma.department.findMany();
        const deptMap = {};
        departments.forEach(d => { deptMap[d.code] = d.name; });

        const groupedEntries = entries.reduce((acc, entry) => {
            const dCode = entry.department;
            if (!acc[dCode]) acc[dCode] = [];
            acc[dCode].push(entry);
            return acc;
        }, {});

        const groupedData = Object.keys(groupedEntries).sort().map(dCode => ({
            departmentCode: dCode,
            departmentName: deptMap[dCode] || dCode,
            students: groupedEntries[dCode]
        }));

        const compLabel = pdfComponent ? `_${pdfComponent}` : '';
        const filename = `Statement_${subject.code}${compLabel}_${category}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const commonData = {
            subject,
            groupedData,
            dateSession: finalDateSession,
            examMonthYear: examMonthYear || `NOV/DEC ${new Date().getFullYear()}`, // Fallback if no session found
            qpCode: qpCode || '',
            packetNoBase: parseInt(packetNo) || 1,
            examTitleBase: `END SEMESTER ${category === 'INTEGRATED' ? 'THEORY ' : (category === 'LAB' ? 'PRACTICAL ' : 'THEORY ')}EXAMINATIONS`,
            boardName: subject.boardName || ''
        };

        if (category === 'LAB' || (category === 'INTEGRATED' && pdfComponent === 'LAB')) {
            pdfService.generateLabStatementOfMarks(res, commonData);
        } else {
            pdfService.generateTheoryStatementOfMarks(res, commonData);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
