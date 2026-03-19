const prisma = require('../lib/prisma');
const PDFDocument = require('pdfkit');
const { logger } = require('../utils/logger');
const { calculateSeatingCIA, calculateSeatingENDSEM } = require('../services/seatingService');
const { getDeptCriteria } = require('../utils/deptUtils');
const { handleError } = require('../utils/errorUtils');


exports.getSessions = async (req, res) => {
    try {
        const sessions = await prisma.examSession.findMany({
            include: {
                subjects: { include: { subject: true } },
                _count: { select: { allocations: true } }
            },
            orderBy: { examDate: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createSession = async (req, res) => {
    try {
        const { examName, examDate, month, year, session, examMode, subjectIds } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const newSession = await tx.examSession.create({
                data: {
                    examName,
                    examDate: examDate ? new Date(examDate) : null,
                    month,
                    year,
                    session: session || "", // Now optional
                    examMode: examMode || "CIA",
                    createdBy: req.user.id
                }
            });

            if (subjectIds && subjectIds.length > 0) {
                await tx.examSessionSubjects.createMany({
                    data: subjectIds.map(id => ({
                        examSessionId: newSession.id,
                        subjectId: parseInt(id)
                    }))
                });
            }

            return newSession;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHalls = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const whereClause = { isActive: true };
        if (sessionId) {
            whereClause.examSessionId = parseInt(sessionId);
        }

        const halls = await prisma.hall.findMany({
            where: whereClause,
            include: { 
                columns: { 
                    include: { benchData: true } 
                } 
            },
            orderBy: { hallName: 'asc' }
        });
        res.json(halls);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addHall = async (req, res) => {
    try {
        const { hallName, blockName, columns } = req.body;

        let totalBenches = 0;
        let capacityCIA = 0;
        let capacityEND = 0;

        if (columns && columns.length > 0) {
            columns.forEach(col => {
                const bCount = parseInt(col.benches) || 0;
                totalBenches += bCount;
                if (col.benchData && col.benchData.length > 0) {
                    col.benchData.forEach(b => {
                        capacityCIA += parseInt(b.capacity) || 0;
                    });
                } else {
                    capacityCIA += bCount * 2; // Fallback
                }
                capacityEND += bCount; // 1 student per bench for END SEM
            });
        }

        // 1. Create Hall
        const hall = await prisma.hall.create({
            data: {
                hallName,
                blockName,
                examSessionId: req.body.sessionId ? parseInt(req.body.sessionId) : null,
                totalBenches,
                capacityCIA,
                capacityEND
            }
        });

        // 2. Create Columns and Benches
        if (columns && columns.length > 0) {
            for (const col of columns) {
                const createdCol = await prisma.hallColumn.create({
                    data: {
                        hallId: hall.id,
                        label: col.label,
                        benches: parseInt(col.benches)
                    }
                });

                if (col.benchData && col.benchData.length > 0) {
                    await prisma.hallBench.createMany({
                        data: col.benchData.map(bench => ({
                            columnId: createdCol.id,
                            benchNumber: parseInt(bench.benchNumber),
                            capacity: parseInt(bench.capacity)
                        }))
                    });
                } else {
                    // Create default 2-person benches if no detailed data provided
                    const benches = Array.from({ length: parseInt(col.benches) }, (_, i) => ({
                        columnId: createdCol.id,
                        benchNumber: i + 1,
                        capacity: 2
                    }));
                    if (benches.length > 0) {
                        await prisma.hallBench.createMany({ data: benches });
                    }
                }
            }
        }

        const result = await prisma.hall.findUnique({
            where: { id: hall.id },
            include: { columns: true }
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateHall = async (req, res) => {
    try {
        const { id } = req.params;
        const { hallName, blockName, columns } = req.body;

        let totalBenches = 0;
        let capacityCIA = 0;
        let capacityEND = 0;

        if (columns && columns.length > 0) {
            columns.forEach(col => {
                const bCount = parseInt(col.benches) || 0;
                totalBenches += bCount;
                if (col.benchData && col.benchData.length > 0) {
                    col.benchData.forEach(b => {
                        capacityCIA += parseInt(b.capacity) || 0;
                    });
                } else {
                    capacityCIA += bCount * 2;
                }
                capacityEND += bCount;
            });
        }

        // 1. Delete existing columns (benches will be cascading deleted or manual)
        // Check if Bench has cascade or handle manually
        // For safety, let's delete benches first if needed, but usually prisma handle cascade if defined in schema.
        await prisma.hallColumn.deleteMany({ where: { hallId: parseInt(id) } });

        // 2. Update Hall metadata
        const hall = await prisma.hall.update({
            where: { id: parseInt(id) },
            data: {
                hallName,
                blockName,
                examSessionId: req.body.sessionId ? parseInt(req.body.sessionId) : undefined, // Keep existing if not provided
                totalBenches,
                capacityCIA,
                capacityEND
            }
        });

        // 3. Re-create Columns and Benches
        if (columns && columns.length > 0) {
            for (const col of columns) {
                const createdCol = await prisma.hallColumn.create({
                    data: {
                        hallId: hall.id,
                        label: col.label,
                        benches: parseInt(col.benches)
                    }
                });

                if (col.benchData && col.benchData.length > 0) {
                    await prisma.hallBench.createMany({
                        data: col.benchData.map(bench => ({
                            columnId: createdCol.id,
                            benchNumber: parseInt(bench.benchNumber),
                            capacity: parseInt(bench.capacity)
                        }))
                    });
                } else {
                    const benches = Array.from({ length: parseInt(col.benches) }, (_, i) => ({
                        columnId: createdCol.id,
                        benchNumber: i + 1,
                        capacity: 2
                    }));
                    if (benches.length > 0) {
                        await prisma.hallBench.createMany({ data: benches });
                    }
                }
            }
        }

        res.json({ message: "Infrastructure updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteHall = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.hall.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Hall deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateAllocations = async (req, res) => {
    try {
        const { sessionId, hallIds, subjectIds, date, session: allocSession } = req.body; // Accept session (FN/AN) from body

        const session = await prisma.examSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: { subjects: true }
        });

        if (!session) return res.status(404).json({ message: "Session not found" });
        if (session.isLocked) return res.status(403).json({ message: "Session is locked. Unlock to regenerate." });

        // 1. Fetch only the requested subjects for this date
        const targetSubjectIds = subjectIds ? subjectIds.map(id => parseInt(id)) : session.subjects.map(s => s.subjectId);
        const subjects = await prisma.subject.findMany({
            where: { id: { in: targetSubjectIds } }
        });

        let allEligibleStudents = [];
        for (const sub of subjects) {
            const deptCriteria = await getDeptCriteria(sub.department);

            // 1a. Fetch Regular Students
            // If subject has no department (empty/null), it's a common/First Year subject.
            // Fetch ALL students of that semester across all departments.
            let studentWhereClause;
            const isFirstYear = !sub.department; // empty string or null = common subject

            if (isFirstYear) {
                // Common subject (First Year): match ALL students of this semester
                studentWhereClause = {
                    semester: sub.semester
                };
            } else {
                // Dept-specific subject
                const isOr = deptCriteria.OR != null;
                if (isOr) {
                    studentWhereClause = {
                        AND: [deptCriteria, { semester: sub.semester }]
                    };
                } else {
                    studentWhereClause = {
                        ...deptCriteria,
                        semester: sub.semester
                    };
                }
            }

            const regularStudents = await prisma.student.findMany({
                where: studentWhereClause,
                include: {
                    eligibility: {
                        where: { subjectId: sub.id, semester: sub.semester }
                    }
                },
                orderBy: { rollNo: 'asc' }
            });
            
            // Filter by eligibility
            const filteredRegular = regularStudents.filter(s => {
                const eligibility = s.eligibility?.[0];
                if (!eligibility) return true; 
                if (eligibility.status === 'DETAINED' && !eligibility.isException) return false;
                return true;
            });

            filteredRegular.forEach(s => s.currentSubjectId = sub.id);
            allEligibleStudents = [...allEligibleStudents, ...filteredRegular];

            // 1b. Fetch Arrear Students IF mode is END_SEM
            if (session.examMode === 'END_SEM') {
                const arrearAttempts = await prisma.arrearAttempt.findMany({
                    where: {
                        arrear: { subjectId: sub.id },
                        resultStatus: null // Active attempt
                    },
                    include: {
                        arrear: { include: { student: true } }
                    }
                });

                const arrearStudents = arrearAttempts.map(attempt => {
                    const s = attempt.arrear.student;
                    s.currentSubjectId = sub.id;
                    s.isArrear = true;
                    return s;
                });

                allEligibleStudents = [...allEligibleStudents, ...arrearStudents];
            }
        }

        const uniqueStudents = [];
        const seenIds = new Set();
        for (const s of allEligibleStudents) {
            if (!seenIds.has(s.id + '-' + s.currentSubjectId)) { // Allow same student for different subjects if they have arrears
                uniqueStudents.push(s);
                seenIds.add(s.id + '-' + s.currentSubjectId);
            }
        }

        if (uniqueStudents.length === 0) {
            return res.status(400).json({
                message: "No eligible students found for the selected subjects."
            });
        }

        // 2. Fetch selected halls
        const halls = await prisma.hall.findMany({
            where: { id: { in: hallIds.map(id => parseInt(id)) }, isActive: true },
            include: { columns: { include: { benchData: true }, orderBy: { label: 'asc' } } }
        });

        const totalCapacity = halls.reduce((acc, h) => {
            return acc + (session.examMode === 'CIA' ? h.capacityCIA : h.capacityEND);
        }, 0);

        if (uniqueStudents.length > totalCapacity) {
            return res.status(400).json({
                message: `Insufficient capacity. Students: ${uniqueStudents.length}, Capacity: ${totalCapacity}`
            });
        }

        // 3. Algorithm
        const { allocations, remaining } = session.examMode === 'CIA'
            ? calculateSeatingCIA(uniqueStudents, halls)
            : calculateSeatingENDSEM(uniqueStudents, halls);

        // 4. Save to DB
        await prisma.$transaction(async (tx) => {
            // Delete allocations for these specific subjects in this session
            await tx.hallAllocation.deleteMany({ 
                where: { 
                    examSessionId: session.id,
                    subjectId: { in: targetSubjectIds }
                } 
            });

            // Update subject dates in the session reference as well
            if (date) {
                for (const sid of targetSubjectIds) {
                    await tx.examSessionSubjects.upsert({
                        where: { examSessionId_subjectId: { examSessionId: session.id, subjectId: sid } },
                        update: { examDate: new Date(date) },
                        create: { examSessionId: session.id, subjectId: sid, examDate: new Date(date) }
                    });
                }
            }

            // Batch create allocations
            for (let i = 0; i < allocations.length; i += 100) {
                const batch = allocations.slice(i, i + 100);
                await tx.hallAllocation.createMany({
                    data: batch.map(a => ({
                        examSessionId: session.id,
                        hallId: a.hallId,
                        studentId: a.studentId,
                        subjectId: a.subjectId,
                        examDate: date ? new Date(date) : null,
                        session: allocSession || null,
                        department: a.department,
                        year: a.year,
                        seatNumber: a.seatNumber,
                        benchIndex: a.benchIndex,
                        columnLabel: a.columnLabel
                    }))
                });
            }
        });

        res.json({
            message: `Allocation generated successfully for ${date || 'session'}`,
            count: allocations.length,
            unallocated: remaining.length
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAllocationByDate = async (req, res) => {
    try {
        const { sessionId, date, session: allocSession } = req.body;
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        await prisma.hallAllocation.deleteMany({
            where: {
                examSessionId: parseInt(sessionId),
                examDate: { gte: dayStart, lte: dayEnd },
                ...(allocSession ? { session: allocSession } : {})
            }
        });
        res.json({ message: "Allocations for the specific date deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSessionAllocations = async (req, res) => {
    try {
        const { id } = req.params;
        const allocations = await prisma.hallAllocation.findMany({
            where: { examSessionId: parseInt(id) },
            include: {
                student: true,
                subject: true,
                hall: true
            },
            orderBy: [{ hallId: 'asc' }, { columnLabel: 'asc' }, { benchIndex: 'asc' }]
        });
        res.json(allocations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleSessionLock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isLocked } = req.body;
        const session = await prisma.examSession.update({
            where: { id: parseInt(id) },
            data: { isLocked }
        });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = parseInt(id);

        // Delete associated subjects and allocations will be handled by Cascading Deletes defined in Prisma schema
        // But for extra safety or if we want to log what's happening, we can do it here.
        await prisma.examSession.delete({
            where: { id: sessionId }
        });

        res.json({ message: "Exam session and its allocations deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSessionSubjects = async (req, res) => {
    try {
        const { id } = req.params;
        const { subjects } = req.body; // Expecting [{ subjectId, examDate }]

        logger.info(`Updating subjects for session ${id}: ${JSON.stringify(subjects)}`);

        const session = await prisma.examSession.findUnique({ where: { id: parseInt(id) } });
        if (!session) return res.status(404).json({ message: "Session not found" });

        await prisma.$transaction(async (tx) => {
            // 1. Delete existing subjects
            await tx.examSessionSubjects.deleteMany({
                where: { examSessionId: parseInt(id) }
            });

            // 2. Add new subjects if any
            if (subjects && subjects.length > 0) {
                for (const sub of subjects) {
                    await tx.examSessionSubjects.create({
                        data: {
                            examSessionId: parseInt(id),
                            subjectId: parseInt(sub.subjectId),
                            examDate: sub.examDate ? new Date(sub.examDate) : null
                        }
                    });
                }
            }
        });

        const updatedSession = await prisma.examSession.findUnique({
            where: { id: parseInt(id) },
            include: { subjects: true }
        });

        res.json(updatedSession);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to group register numbers into ranges
const getRegisterRanges = (students) => {
    if (!students || students.length === 0) return "";

    const regNos = students.map(s => s.registerNumber || s.rollNo).filter(Boolean).sort();

    const ranges = [];
    let start = regNos[0];
    let prev = regNos[0];

    for (let i = 1; i <= regNos.length; i++) {
        const current = regNos[i];

        const prevNum = parseInt(String(prev).slice(-3));
        const currNum = current ? parseInt(String(current).slice(-3)) : null;
        const prevPrefix = String(prev).slice(0, -3);
        const currPrefix = current ? String(current).slice(0, -3) : null;

        if (currNum !== prevNum + 1 || prevPrefix !== currPrefix || i === regNos.length) {
            if (start === prev) {
                ranges.push(start);
            } else {
                ranges.push(`${start}-${String(prev).slice(-3)}`);
            }
            start = current;
        }
        prev = current;
    }
    return ranges.join(", ");
};

const getRomanNumeral = (num) => {
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    return roman[num] || num;
};

exports.exportConsolidatedPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query; // Support date-specific export
        const session = await prisma.examSession.findUnique({
            where: { id: parseInt(id) }
        });

        if (!session) return res.status(404).json({ message: "Session not found" });

        const deptsFromDb = await prisma.department.findMany();
        const deptMap = {};
        deptsFromDb.forEach(d => {
            deptMap[d.name] = d.code || d.name;
        });

        const whereClause = { examSessionId: parseInt(id) };
        if (date) {
            // Filter by date using a date-range to avoid millisecond mismatch
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);
            whereClause.examDate = { gte: dayStart, lte: dayEnd };
        }
        if (req.query.session) {
            whereClause.session = req.query.session;
        }

        const allocations = await prisma.hallAllocation.findMany({
            where: whereClause,
            include: {
                student: true,
                subject: true,
                hall: { include: { columns: true } }
            },
            orderBy: [
                { hall: { hallName: 'asc' } },
                { year: 'asc' },
                { department: 'asc' },
                { student: { rollNo: 'asc' } }
            ]
        });

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Consolidated_Plan_${session.examName.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        const drawMainHeader = () => {
            const logoPath = require('path').join(process.cwd(), '..', 'client', 'public', 'miet-logo.png');
            try { doc.image(logoPath, 40, 30, { width: 70 }); } catch (e) { }

            doc.fontSize(16).font('Helvetica-Bold').text('M.I.E.T. ENGINEERING COLLEGE', 120, 35, { align: 'center', width: 400 });
            doc.fontSize(10).font('Helvetica').text('(AUTONOMOUS)', 120, 52, { align: 'center', width: 400 });
            doc.fontSize(9).font('Helvetica').text('(AFFILIATED TO ANNA UNIVERSITY, CHENNAI)', 120, 64, { align: 'center', width: 400 });
            doc.fontSize(9).font('Helvetica').text('TIRUCHIRAPPALLI', 120, 75, { align: 'center', width: 400 });
            doc.fontSize(10).font('Helvetica-Bold').text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', 120, 90, { align: 'center', width: 400 });

            // Border for header
            doc.rect(40, 30, 515, 80).stroke();

            // Sub titles border
            doc.rect(40, 115, 515, 30).stroke();
            doc.fontSize(11).font('Helvetica-Bold').text(session.examName.toUpperCase(), 30, 120, { align: 'center', width: 535 });
            doc.fontSize(10).font('Helvetica-Bold').text('CONSOLIDATED HALL PLAN', 30, 134, { align: 'center', width: 535 });
        };

        const hallGroups = {};
        allocations.forEach(a => {
            const hId = a.hallId;
            if (!hallGroups[hId]) {
                hallGroups[hId] = {
                    name: a.hall.hallName,
                    totalStrength: 0,
                    deptData: {}
                };
            }
            const h = hallGroups[hId];
            h.totalStrength++;

            const shortDept = deptMap[a.department] || a.department;
            const key = `${a.subject.semester}-${shortDept}`;
            if (!h.deptData[key]) {
                h.deptData[key] = {
                    sem: a.subject.semester,
                    dept: shortDept,
                    students: []
                };
            }
            h.deptData[key].students.push(a.student);
        });

        drawMainHeader();

        let currentY = 145;
        const colX = { sno: 40, sem: 65, dept: 95, hall: 145, reg: 205, str: 445, total: 495, end: 555 };
        const colW = {
            sno: colX.sem - colX.sno,
            sem: colX.dept - colX.sem,
            dept: colX.hall - colX.dept,
            hall: colX.reg - colX.hall,
            reg: colX.str - colX.reg,
            str: colX.total - colX.str,
            total: colX.end - colX.total
        };

        const drawTableHeader = (y) => {
            doc.rect(colX.sno, y, colX.end - colX.sno, 30).fill('#f0f0f0');
            doc.rect(colX.sno, y, colX.end - colX.sno, 30).stroke();
            doc.fill('#000000').font('Helvetica-Bold').fontSize(10);

            Object.values(colX).forEach(x => {
                if (x !== colX.end) doc.moveTo(x, y).lineTo(x, y + 30).stroke();
            });

            const textY = y + 10;
            doc.text('S.\nNo.', colX.sno, y + 4, { width: colW.sno, align: 'center' });
            doc.text('Sem', colX.sem, textY, { width: colW.sem, align: 'center' });
            doc.text('Dept.', colX.dept, textY, { width: colW.dept, align: 'center' });
            doc.text('Hall\nName', colX.hall, y + 4, { width: colW.hall, align: 'center' });
            doc.text('Register Number', colX.reg, textY, { width: colW.reg, align: 'center' });
            doc.text('Strength', colX.str, textY, { width: colW.str, align: 'center' });
            doc.text('Total\nStrength', colX.total, y + 4, { width: colW.total, align: 'center' });
            return y + 30;
        };

        doc.lineWidth(0.5);
        currentY = drawTableHeader(currentY);
        let sNo = 1;

        Object.values(hallGroups).forEach(hall => {
            const depts = Object.values(hall.deptData);

            depts.forEach(d => {
                const ranges = getRegisterRanges(d.students);
                d.rangesText = ranges;
                const textHeight = doc.font('Helvetica').fontSize(12).heightOfString(ranges, { width: colW.reg - 8 });
                d.rowHeight = Math.max(30, textHeight + 15);
            });

            const hallHeight = depts.reduce((sum, d) => sum + d.rowHeight, 0);

            if (currentY + hallHeight > 780) {
                doc.addPage();
                drawMainHeader();
                currentY = 145;
                currentY = drawTableHeader(currentY);
            }

            const hallStartY = currentY;
            let rowY = currentY;

            depts.forEach((d) => {
                doc.font('Helvetica').fontSize(10);

                doc.rect(colX.sem, rowY, colW.sem, d.rowHeight).stroke();
                const semText = getRomanNumeral(d.sem);
                doc.text(semText, colX.sem, rowY + (d.rowHeight / 2) - 4, { width: colW.sem, align: 'center' });

                doc.rect(colX.dept, rowY, colW.dept, d.rowHeight).stroke();
                doc.fontSize(12).font('Helvetica-Bold').text(d.dept, colX.dept, rowY + (d.rowHeight / 2) - 6, { width: colW.dept, align: 'center' });

                doc.rect(colX.reg, rowY, colW.reg, d.rowHeight).stroke();
                doc.font('Helvetica');
                const textH = doc.fontSize(12).heightOfString(d.rangesText, { width: colW.reg - 8 });
                doc.text(d.rangesText, colX.reg + 4, rowY + (d.rowHeight / 2) - (textH / 2), { width: colW.reg - 8, align: 'left', lineGap: 1 });

                doc.rect(colX.str, rowY, colW.str, d.rowHeight).stroke();
                doc.text(d.students.length.toString(), colX.str, rowY + (d.rowHeight / 2) - 4, { width: colW.str, align: 'center' });

                rowY += d.rowHeight;
            });

            doc.rect(colX.sno, hallStartY, colW.sno, hallHeight).stroke();
            doc.font('Helvetica').fontSize(10).text(sNo.toString(), colX.sno, hallStartY + (hallHeight / 2) - 4, { width: colW.sno, align: 'center' });

            doc.rect(colX.hall, hallStartY, colW.hall, hallHeight).stroke();
            doc.fontSize(14).font('Helvetica-Bold').text(hall.name, colX.hall, hallStartY + (hallHeight / 2) - 7, { width: colW.hall, align: 'center' });

            doc.rect(colX.total, hallStartY, colW.total, hallHeight).stroke();
            doc.fontSize(10).text(hall.totalStrength.toString(), colX.total, hallStartY + (hallHeight / 2) - 4, { width: colW.total, align: 'center' });

            currentY += hallHeight;
            sNo++;
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.exportSeatingGrid = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.examSession.findUnique({
            where: { id: parseInt(id) }
        });

        if (!session) return res.status(404).json({ message: "Session not found" });

        const deptsFromDb = await prisma.department.findMany();
        const deptMap = {};
        deptsFromDb.forEach(d => {
            deptMap[d.name] = d.code || d.name;
        });

        const allocations = await prisma.hallAllocation.findMany({
            where: { examSessionId: parseInt(id) },
            include: {
                student: true,
                subject: true,
                hall: { include: { columns: { include: { benchData: true } } } }
            },
            orderBy: [{ hall: { hallName: 'asc' } }, { columnLabel: 'asc' }, { benchIndex: 'asc' }]
        });

        const doc = new PDFDocument({ margins: { top: 30, bottom: 15, left: 30, right: 30 }, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Seating_Grid_${session.examName.replace(/\s+/g, '_')}.pdf`);
        doc.pipe(res);

        const halls = Array.from(new Set(allocations.map(a => a.hallId)));
        const allDepts = [...new Set(allocations.map(a => a.department))].sort();
        const shadedDepts = allDepts.filter((_, i) => i % 2 !== 0);

        // A4 Landscape available width with 30px margins = 841.89 - 60 = ~780
        const availableWidth = 780;

        halls.forEach((hId, index) => {
            if (index > 0) doc.addPage();

            const hallAllocations = allocations.filter(a => a.hallId === hId);
            const hall = hallAllocations[0].hall;

            const logoPath = require('path').join(process.cwd(), '..', 'client', 'public', 'miet-logo.png');
            try { doc.image(logoPath, 40, 30, { width: 70 }); } catch (e) { }

            doc.fontSize(22).font('Helvetica-Bold').text('M.I.E.T. ENGINEERING COLLEGE', 120, 35, { align: 'center', width: availableWidth - 80 });
            doc.fontSize(10).font('Helvetica').text('(AUTONOMOUS)', 120, 60, { align: 'center', width: availableWidth - 80 });
            doc.fontSize(9).font('Helvetica').text('(AFFILIATED TO ANNA UNIVERSITY, CHENNAI)', 120, 72, { align: 'center', width: availableWidth - 80 });
            doc.fontSize(9).font('Helvetica').text('TIRUCHIRAPPALLI', 120, 83, { align: 'center', width: availableWidth - 80 });
            doc.fontSize(12).font('Helvetica-Bold').text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', 120, 98, { align: 'center', width: availableWidth - 80 });

            doc.rect(40, 30, availableWidth, 85).stroke();

            doc.rect(40, 120, availableWidth, 25).stroke();
            doc.fontSize(14).font('Helvetica-Bold').text(session.examName.toUpperCase(), 50, 126);
            doc.fontSize(14).font('Helvetica-Bold').text(`HALL NO - ${hall.hallName}`, availableWidth - 100, 126, { width: 130, align: 'right' });

            const colLabels = hall.columns.map(c => c.label);
            const maxBenches = Math.max(...hall.columns.map(c => c.benches));

            const startX = 40;
            let currentX = startX;
            const blockW = availableWidth / colLabels.length;
            const seatW = blockW < 100 ? 20 : 25; // Responsive to col count
            const stuW = (blockW - seatW) / 2;

            const headerY1 = 150;
            const headerY2 = headerY1 + 15;
            const headerCellH = 45; // Taller headers to fit larger font
            const seatCellH = 45; // Taller seat cells

            colLabels.forEach((label, i) => {
                doc.rect(currentX, headerY1, seatW, 15).stroke();
                if (i === 0) {
                    doc.fontSize(8).font('Helvetica-Bold').text('Stage', currentX, headerY1 + 3, { width: seatW, align: 'center' });
                }

                doc.rect(currentX + seatW, headerY1, stuW * 2, 15).stroke();
                doc.fontSize(13).font('Helvetica-Bold').text(label, currentX + seatW, headerY1 + 1, { width: stuW * 2, align: 'center' });

                const benchAllocations = hallAllocations.filter(a => a.columnLabel === label);
                const leftStus = benchAllocations.filter(a => a.seatNumber.endsWith('A') || a.seatNumber === a.columnLabel + a.benchIndex);
                const rightStus = benchAllocations.filter(a => a.seatNumber.endsWith('B'));

                const getHeaderStr = (stus) => {
                    const unique = [...new Set(stus.map(s => {
                        let dept = deptMap[s.department] || s.department;
                        let subCode = s.subject?.code ? ` (${s.subject.code})` : "";
                        return `${getRomanNumeral(s.year)} ${dept}${subCode}`;
                    }))];
                    return unique.join(' /\n');
                };

                let leftStr = getHeaderStr(leftStus);
                let rightStr = getHeaderStr(rightStus);

                if (session.examMode === 'CIA') {
                    doc.rect(currentX + seatW, headerY2, stuW, headerCellH).stroke();
                    doc.rect(currentX + seatW + stuW, headerY2, stuW, headerCellH).stroke();
                    const leftH = doc.fontSize(10).font('Helvetica-Bold').heightOfString(leftStr, { width: stuW - 2 });
                    const rightH = doc.fontSize(10).font('Helvetica-Bold').heightOfString(rightStr, { width: stuW - 2 });
                    doc.text(leftStr, currentX + seatW + 1, headerY2 + (headerCellH / 2) - (leftH / 2), { width: stuW - 2, align: 'center', lineGap: 1 });
                    doc.text(rightStr, currentX + seatW + stuW + 1, headerY2 + (headerCellH / 2) - (rightH / 2), { width: stuW - 2, align: 'center', lineGap: 1 });
                } else {
                    doc.rect(currentX + seatW, headerY2, stuW * 2, headerCellH).stroke();
                    const leftH = doc.fontSize(11).font('Helvetica-Bold').heightOfString(leftStr, { width: stuW * 2 - 2 });
                    doc.text(leftStr, currentX + seatW + 1, headerY2 + (headerCellH / 2) - (leftH / 2), { width: stuW * 2 - 2, align: 'center', lineGap: 1 });
                }

                doc.rect(currentX, headerY2, seatW, headerCellH).stroke();

                currentX += blockW;
            });

            let currentY = headerY2 + headerCellH;
            for (let b = 1; b <= maxBenches; b++) {
                currentX = startX;
                colLabels.forEach((label) => {
                    const col = hall.columns.find(c => c.label === label);
                    const bench = col?.benchData?.find(bd => bd.benchNumber === b);
                    const capacity = bench?.capacity || 2;

                    doc.rect(currentX, currentY, seatW, seatCellH).stroke();
                    doc.fontSize(9).font('Helvetica-Bold').text(`${label}${b}`, currentX, currentY + (seatCellH / 2) - 5, { width: seatW, align: 'center' });

                    const benchStus = hallAllocations.filter(a => a.columnLabel === label && a.benchIndex === b);

                    if (session.examMode === 'CIA') {
                        if (capacity === 1) {
                            const stu = benchStus[0];
                            if (stu) {
                                if (shadedDepts.includes(stu.department)) {
                                    doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).fill('#f2f2f2');
                                }
                                doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).stroke();
                                doc.fill('#000000');
                                const text = stu.student.registerNumber || stu.student.rollNo;
                                const textFontSize = text && text.length > 8 ? 12 : 14;
                                const textH = doc.fontSize(textFontSize).font('Helvetica').heightOfString(text, { width: stuW * 2, lineBreak: false });
                                doc.text(text, currentX + seatW, currentY + (seatCellH / 2) - (textH / 2), { width: stuW * 2, align: 'center', lineBreak: false });
                            } else {
                                doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).stroke();
                            }
                        } else {
                            const leftStu = benchStus.find(a => a.seatNumber.endsWith('A'));
                            const rightStu = benchStus.find(a => a.seatNumber.endsWith('B'));

                            if (leftStu) {
                                if (shadedDepts.includes(leftStu.department)) {
                                    doc.rect(currentX + seatW, currentY, stuW, seatCellH).fill('#f2f2f2');
                                }
                                doc.rect(currentX + seatW, currentY, stuW, seatCellH).stroke();
                                doc.fill('#000000');
                                const leftText = leftStu.student.registerNumber || leftStu.student.rollNo;
                                const textFontSize = leftText && leftText.length > 8 ? 11 : 12;
                                const textH = doc.fontSize(textFontSize).font('Helvetica').heightOfString(leftText, { width: stuW, lineBreak: false });
                                doc.text(leftText, currentX + seatW, currentY + (seatCellH / 2) - (textH / 2), { width: stuW, align: 'center', lineBreak: false });
                            } else {
                                doc.rect(currentX + seatW, currentY, stuW, seatCellH).stroke();
                            }

                            if (rightStu) {
                                if (shadedDepts.includes(rightStu.department)) {
                                    doc.rect(currentX + seatW + stuW, currentY, stuW, seatCellH).fill('#f2f2f2');
                                }
                                doc.rect(currentX + seatW + stuW, currentY, stuW, seatCellH).stroke();
                                doc.fill('#000000');
                                const rightText = rightStu.student.registerNumber || rightStu.student.rollNo;
                                const textFontSize = rightText && rightText.length > 8 ? 11 : 12;
                                const textH = doc.fontSize(textFontSize).font('Helvetica').heightOfString(rightText, { width: stuW, lineBreak: false });
                                doc.text(rightText, currentX + seatW + stuW, currentY + (seatCellH / 2) - (textH / 2), { width: stuW, align: 'center', lineBreak: false });
                            } else {
                                doc.rect(currentX + seatW + stuW, currentY, stuW, seatCellH).stroke();
                            }
                        }
                    } else {
                        const stu = benchStus[0];
                        if (stu) {
                            if (shadedDepts.includes(stu.department)) {
                                doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).fill('#f2f2f2');
                            }
                            doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).stroke();
                            doc.fill('#000000');
                            const text = stu.student.registerNumber || stu.student.rollNo;
                            const textFontSize = text && text.length > 8 ? 16 : 18;
                            const textH = doc.fontSize(textFontSize).font('Helvetica').heightOfString(text, { width: stuW * 2, lineBreak: false });
                            doc.text(text, currentX + seatW, currentY + (seatCellH / 2) - (textH / 2), { width: stuW * 2, align: 'center', lineBreak: false });
                        } else {
                            doc.rect(currentX + seatW, currentY, stuW * 2, seatCellH).stroke();
                        }
                    }

                    currentX += blockW;
                });
                currentY += seatCellH;
            }

            const summaryY = currentY + 15;
            if (summaryY < 570) {
                const deptStats = {};
                hallAllocations.forEach(a => {
                    let dept = deptMap[a.department] || a.department;
                    let subCode = a.subject?.code ? ` (${a.subject.code})` : "";
                    const key = `${getRomanNumeral(a.year)} ${dept}${subCode}`;
                    deptStats[key] = (deptStats[key] || 0) + 1;
                });

                const keys = Object.keys(deptStats);
                let statX = startX;
                const statW = 75; // wider summary box
                const statH = Object.keys(deptStats).some(k => k.length > 10) ? 30 : 20;

                keys.forEach(k => {
                    const isShaded = shadedDepts.some(sd => k.includes(sd));
                    if (isShaded) {
                        doc.rect(statX, summaryY, statW, statH).fill('#f2f2f2');
                        doc.rect(statX, summaryY + statH, statW, 20).fill('#f2f2f2');
                    }
                    doc.rect(statX, summaryY, statW, statH).stroke();
                    doc.fill('#000000');
                    const th = doc.fontSize(9).font('Helvetica-Bold').heightOfString(k, { width: statW - 4 });
                    doc.text(k, statX + 2, summaryY + (statH / 2) - (th / 2), { width: statW - 4, align: 'center' });
                    doc.rect(statX, summaryY + statH, statW, 20).stroke();
                    doc.fontSize(11).font('Helvetica').text(deptStats[k].toString(), statX, summaryY + statH + 5, { width: statW, align: 'center' });
                    statX += statW;
                });

                doc.rect(statX, summaryY, statW, statH).stroke();
                doc.fontSize(9).font('Helvetica-Bold').text('TOTAL', statX, summaryY + (statH / 2) - 4, { width: statW, align: 'center' });
                doc.rect(statX, summaryY + statH, statW, 20).stroke();
                doc.fontSize(11).font('Helvetica-Bold').text(hallAllocations.length.toString(), statX, summaryY + statH + 5, { width: statW, align: 'center' });

                doc.fontSize(12).font('Helvetica-Bold').text('CONTROLLER OF EXAMINATIONS', startX, summaryY + statH + 20, { width: availableWidth, align: 'right' });
            }
        });

        doc.end();
    } catch (error) {
        handleError(res, error, "Failed to export seating grid");
    }
};


