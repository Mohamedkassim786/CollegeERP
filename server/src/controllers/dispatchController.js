const prisma = require('../lib/prisma');
const { handleError } = require('../utils/errorUtils');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// GET /admin/dispatch/subjects
const getSubjectsForDispatch = async (req, res) => {
    try {
        const { semester } = req.query;
        let where = {};
        if (semester) {
            where.semester = parseInt(semester);
        }
        const subjects = await prisma.subject.findMany({
            where,
            select: { id: true, code: true, name: true, semester: true },
            orderBy: [{ semester: 'asc' }, { code: 'asc' }]
        });
        res.json(subjects);
    } catch (error) {
        handleError(res, error, 'Error fetching subjects for dispatch');
    }
};

// GET /admin/dispatch/allocation-dates
const getAllocationDates = async (req, res) => {
    try {
        const dates = await prisma.hallAllocation.findMany({
            where: { examDate: { not: null } },
            select: { examDate: true },
            distinct: ['examDate'],
            orderBy: { examDate: 'asc' }
        });
        res.json(dates.map(d => d.examDate));
    } catch (error) {
        handleError(res, error, 'Error fetching allocation dates');
    }
};

// GET /admin/dispatch/allocation-subjects?date=X&session=X
const getSubjectsByAllocation = async (req, res) => {
    try {
        const { date, session } = req.query;
        if (!date || !session) {
            return res.status(400).json({ error: 'date and session are required' });
        }

        const subjects = await prisma.hallAllocation.findMany({
            where: {
                examDate: new Date(date),
                session: session
            },
            select: {
                subject: {
                    select: { id: true, code: true, name: true, semester: true }
                }
            },
            distinct: ['subjectId']
        });

        res.json(subjects.map(s => s.subject));
    } catch (error) {
        handleError(res, error, 'Error fetching subjects by allocation');
    }
};

// GET /admin/dispatch/students?subjectId=X&date=X&session=X&mode=CIA|END
const getStudentsForDispatch = async (req, res) => {
    try {
        const { subjectId, semester, date, session, mode } = req.query;
        if (!subjectId) {
            return res.status(400).json({ error: 'subjectId is required' });
        }

        const subIdInt = parseInt(subjectId);
        const isEndSem = mode === 'END';

        let students = [];

        if (isEndSem) {
            if (!date || !session) {
                return res.status(400).json({ error: 'date and session are required for End Sem mode' });
            }
            // Fetch students from HallAllocation
            const allocations = await prisma.hallAllocation.findMany({
                where: {
                    subjectId: subIdInt,
                    examDate: new Date(date),
                    session: session
                },
                include: {
                    student: {
                        select: {
                            id: true, name: true, registerNumber: true, rollNo: true, department: true, section: true, semester: true, currentSemester: true,
                            dummyMappings: {
                                where: { subjectId: subIdInt },
                                select: { isAbsent: true, boardCode: true, qpCode: true }
                            }
                        }
                    }
                }
            });

            students = allocations.map(a => {
                const s = a.student;
                const mapping = s.dummyMappings[0];
                return {
                    ...s,
                    isArrear: false, // In End Sem mode, we just list everyone allocated
                    isAbsent: mapping?.isAbsent || false,
                    boardCode: mapping?.boardCode || "",
                    qpCode: mapping?.qpCode || ""
                };
            });
        } else {
            // Original CIA/Lab logic logic (by semester)
            if (!semester) return res.status(400).json({ error: 'semester required for CIA mode' });
            const semInt = parseInt(semester);
            const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
            if (!subject) return res.status(404).json({ error: 'Subject not found' });

            const { getDeptCriteria } = require('../utils/deptUtils');
            const deptCriteria = await getDeptCriteria(subject.department);

            const regularStudents = await prisma.student.findMany({
                where: { ...deptCriteria, currentSemester: semInt, status: 'ACTIVE', registerNumber: { not: null } },
                select: {
                    id: true, name: true, registerNumber: true, rollNo: true, department: true, section: true, semester: true, currentSemester: true,
                    dummyMappings: { where: { subjectId: subIdInt }, select: { isAbsent: true, boardCode: true, qpCode: true } }
                }
            });

            const regularIds = new Set(regularStudents.map(s => s.id));
            const activeArrearAttempts = await prisma.arrearAttempt.findMany({
                where: { arrear: { subjectId: subIdInt }, resultStatus: null },
                include: {
                    arrear: {
                        include: {
                            student: {
                                select: {
                                    id: true, name: true, registerNumber: true, rollNo: true, department: true, section: true, semester: true, currentSemester: true,
                                    dummyMappings: { where: { subjectId: subIdInt }, select: { isAbsent: true, boardCode: true, qpCode: true } }
                                }
                            }
                        }
                    }
                }
            });

            students = [
                ...regularStudents.map(s => ({
                    ...s,
                    isArrear: false,
                    isAbsent: s.dummyMappings[0]?.isAbsent || false,
                    boardCode: s.dummyMappings[0]?.boardCode || "",
                    qpCode: s.dummyMappings[0]?.qpCode || ""
                })),
                ...activeArrearAttempts
                    .map(attempt => attempt.arrear.student)
                    .filter(student => !regularIds.has(student.id))
                    .map(student => ({
                        ...student,
                        isArrear: true,
                        isAbsent: student.dummyMappings[0]?.isAbsent || false,
                        boardCode: student.dummyMappings[0]?.boardCode || "",
                        qpCode: student.dummyMappings[0]?.qpCode || ""
                    }))
            ];
        }

        // Sort
        students.sort((a, b) => {
            const numA = parseInt((a.registerNumber || '').replace(/\D/g, '')) || 0;
            const numB = parseInt((b.registerNumber || '').replace(/\D/g, '')) || 0;
            return numA - numB || (a.registerNumber || '').localeCompare(b.registerNumber || '');
        });

        res.json(students);
    } catch (error) {
        handleError(res, error, 'Error fetching students for dispatch');
    }
};

const saveDispatchAbsentees = async (req, res) => {
    try {
        const { subjectId, boardCode, qpCode, students } = req.body; // students: array of { id, isAbsent }
        if (!subjectId || !students || !Array.isArray(students)) {
            return res.status(400).json({ error: 'subjectId and students are required' });
        }

        const subIdInt = parseInt(subjectId);
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ error: 'Subject not found' });

        const studentIds = students.map(s => s.id);
        const studentRecords = await prisma.student.findMany({
            where: { id: { in: studentIds } },
            select: { id: true, registerNumber: true, department: true, semester: true, currentSemester: true, section: true }
        });

        const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
        const academicYearStr = activeYear ? activeYear.year : "2023-24";

        const operations = students.map(s => {
            const student = studentRecords.find(st => st.id === s.id);
            if (!student) return null;

            return prisma.subjectDummyMapping.upsert({
                where: { studentId_subjectId: { studentId: s.id, subjectId: subIdInt } },
                update: {
                    isAbsent: s.isAbsent,
                    boardCode: boardCode || undefined,
                    qpCode: qpCode || undefined
                },
                create: {
                    studentId: s.id,
                    subjectId: subIdInt,
                    originalRegisterNo: student.registerNumber || "",
                    subjectCode: subject.code,
                    department: student.department || "",
                    semester: student.currentSemester || student.semester || 0,
                    section: student.section || "A",
                    academicYear: academicYearStr,
                    isAbsent: s.isAbsent,
                    boardCode: boardCode || "",
                    qpCode: qpCode || ""
                }
            });
        }).filter(op => op !== null);

        await prisma.$transaction(operations);

        res.json({ message: 'Absentees and exam codes saved successfully' });
    } catch (error) {
        handleError(res, error, 'Error saving dispatch absentees');
    }
};

// Helper: draw text at absolute position without affecting cursor
function drawText(doc, text, x, y, options = {}) {
    doc.text(text, x, y, { lineBreak: false, ...options });
}

// POST /admin/dispatch/export-pdf
const exportDispatchPDF = async (req, res) => {
    try {
        const {
            subjectId,
            subjectCode,
            subjectName,
            semester,
            dispatchIndex,
            totalDispatches,
            date,
            time,
            session,
            ampm,
            boardCode,
            qpCode,
            students,
        } = req.body;

        if (!students || !Array.isArray(students)) {
            return res.status(400).json({ error: 'students array is required' });
        }

        const MIET_LOGO = path.join(__dirname, '../../../client/public/miet-logo.png');
        const PAGE_W = 841.89; // A4 Landscape
        const PAGE_H = 595.28;
        const M = 32;
        const CW = PAGE_W - M * 2;

        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margin: 0,
            info: { Title: 'Dispatch Sheet - MIET' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="dispatch_${(dispatchIndex || 0) + 1}.pdf"`);
        doc.pipe(res);

        // ── LOGO ───────────────────────────────────────────────────────────────
        const LOGO_SZ = 60;
        const LOGO_X = M + 20;
        const LOGO_Y = M + 5;
        if (fs.existsSync(MIET_LOGO)) {
            doc.image(MIET_LOGO, LOGO_X, LOGO_Y, { width: LOGO_SZ });
        }

        // ── TITLE BLOCK (Centred) ─────────────────────────────────────────────
        const TY = M;
        doc.font('Helvetica-Bold').fontSize(16).fillColor('black');
        doc.text('M.I.E.T. ENGINEERING COLLEGE', M, TY, { width: CW, align: 'center' });

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('(Autonomous)', M, TY + 18, { width: CW, align: 'center' });

        doc.font('Helvetica').fontSize(9);
        doc.text('Affiliated to Anna University, Chennai', M, TY + 31, { width: CW, align: 'center' });
        doc.text('TIRUCHIRAPPALLI - 620 007', M, TY + 42, { width: CW, align: 'center' });

        doc.font('Helvetica-Bold').fontSize(13);
        doc.text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', M, TY + 56, { width: CW, align: 'center' });

        // ── DIVIDER 1 ──────────────────────────────────────────────────────────
        const D1Y = TY + 75;
        doc.moveTo(M, D1Y).lineTo(PAGE_W - M, D1Y).lineWidth(1.2).strokeColor('black').stroke();

        // ── INSTITUTION / SUBJECT ROW ──────────────────────────────────────────
        const INFO_Y = D1Y + 10;
        const HALF = CW / 2;
        const INFO_FONT = 10;

        const fmtDate = date
            ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
            : '---';
        const sessionDisplay = session || 'FN';
        const examDateStr = `${fmtDate} / ${sessionDisplay} (${time || '10:00'} ${ampm || 'AM'} - 1:00 PM)`;

        doc.font('Helvetica-Bold').fontSize(INFO_FONT).fillColor('black');
        drawText(doc, 'Exam Date:  ', M, INFO_Y);
        doc.font('Helvetica').fontSize(INFO_FONT);
        drawText(doc, examDateStr, M + 65, INFO_Y);

        doc.font('Helvetica-Bold').fontSize(INFO_FONT);
        drawText(doc, 'QP Code: ', M + HALF, INFO_Y);
        doc.font('Helvetica').fontSize(INFO_FONT);
        drawText(doc, qpCode || '', M + HALF + 65, INFO_Y);

        const SUB_Y = INFO_Y + 18;
        doc.font('Helvetica-Bold').fontSize(INFO_FONT);
        drawText(doc, 'Subject:    ', M, SUB_Y);
        doc.font('Helvetica').fontSize(INFO_FONT);
        // Format: CODE - NAME
        const fullSub = `${subjectCode || ''} - ${subjectName || ''}`;
        drawText(doc, fullSub.toUpperCase(), M + 65, SUB_Y);

        // ── DIVIDER 2 ──────────────────────────────────────────────────────────
        const D2Y = SUB_Y + 15;
        doc.moveTo(M, D2Y).lineTo(PAGE_W - M, D2Y).lineWidth(0.8).stroke();

        // ── BOXED STUDENT GRID ────────────────────────────────────────────────
        const FT_H = 15;
        const SIG_H = 80; // Larger signature box
        const NOTE_H = 20;
        const SUM_H = 30;
        const BOTTOM_BLOCK = FT_H + SIG_H + NOTE_H + SUM_H + 5;

        const GRID_Y = D2Y + 8;
        const GRID_AVAIL_H = PAGE_H - M - BOTTOM_BLOCK - GRID_Y;

        const COLS = 5;
        const ROWS = 10;
        const COL_W = CW / COLS;
        const ROW_H = Math.floor(GRID_AVAIL_H / ROWS);

        const BOX_PAD = 3;
        const BOX_W = COL_W - BOX_PAD * 2;
        const BOX_H = ROW_H - BOX_PAD * 2;

        doc.lineWidth(0.5).strokeColor('black');

        // Row-major grid
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const idx = row * COLS + col;
                if (idx >= students.length) break;

                const s = students[idx];
                const x = M + col * COL_W + BOX_PAD;
                const y = GRID_Y + row * ROW_H + BOX_PAD;

                // Draw Box
                if (s.isAbsent) {
                    doc.rect(x, y, BOX_W, BOX_H).fillColor('#fff0f0').fillAndStroke();
                } else if (s.isArrear) {
                    doc.rect(x, y, BOX_W, BOX_H).fillColor('#fffaf0').fillAndStroke();
                } else {
                    doc.rect(x, y, BOX_W, BOX_H).stroke();
                }

                // Text
                const regText = s.registerNumber || '';
                const fontSize = Math.min(12, BOX_H * 0.55);
                doc.font('Helvetica-Bold').fontSize(fontSize);

                if (s.isAbsent) doc.fillColor('red');
                else if (s.isArrear) doc.fillColor('#b35800');
                else doc.fillColor('black');

                // Center text in box
                const textW = doc.widthOfString(regText);
                const textX = x + (BOX_W - textW) / 2;
                const textY = y + (BOX_H - fontSize) / 2 + 1;

                doc.text(regText.toUpperCase(), textX, textY, { lineBreak: false });

                if (s.isAbsent || s.isArrear) {
                    doc.fontSize(fontSize - 4).text(s.isAbsent ? ' AB' : ' AR', textX + textW, textY + 2);
                }
            }
        }

        doc.fillColor('black').lineWidth(1.2);

        // ── SUMMARY & FOOTER ──────────────────────────────────────────────────
        const SUM_Y = PAGE_H - M - FT_H - SIG_H - NOTE_H - SUM_H;
        doc.moveTo(M, SUM_Y).lineTo(PAGE_W - M, SUM_Y).stroke();

        const totalCount = students.length;
        const abCount = students.filter(s => s.isAbsent).length;
        const mpCount = students.filter(s => s.isMalpractice).length;
        const presentCount = totalCount - abCount;

        doc.font('Helvetica-Bold').fontSize(14);
        const summ = `Bd : ${boardCode || ''}          Total: ${totalCount}  ( AB : ${abCount}  MP : ${mpCount}  Present : ${presentCount} )`;
        doc.text(summ, M, SUM_Y + 8, { width: CW, align: 'center' });

        const NOTE_Y = SUM_Y + SUM_H + 2;
        doc.font('Helvetica').fontSize(6);
        doc.text('** This page should be pasted on the top of Answer booklet cover.      ** Absentees / Malpractice / Discrepancies should be marked before taking print.', M, NOTE_Y, { width: CW, align: 'center' });

        const SIG_Y = PAGE_H - M - FT_H - SIG_H;
        doc.rect(M, SIG_Y, CW, SIG_H).stroke();

        const SI_Y = SIG_Y + 15;
        doc.font('Helvetica-Bold').fontSize(10);

        // Col 1
        doc.text('STATION: ________________', M + 20, SI_Y);
        doc.text('DATE   : ___/___/___', M + 20, SI_Y + 30);

        // Col 2 (Representative)
        doc.text('Signature of the', M + CW * 0.35, SI_Y, { width: CW * 0.3, align: 'center' });
        doc.text('University Representative', M + CW * 0.35, SI_Y + 12, { width: CW * 0.3, align: 'center' });

        // Col 3 (Superintendent)
        doc.text('Signature of the Chief Superintendent', M + CW * 0.65, SI_Y, { width: CW * 0.3, align: 'center' });
        doc.text('CENTRE: _______ (COLLEGE SEAL)', M + CW * 0.65, SI_Y + 30, { width: CW * 0.3, align: 'center' });

        // Final Footer
        doc.fontSize(8).font('Helvetica');
        doc.text(fmtDate, M, PAGE_H - 18);
        doc.text(`Page 1/1`, M, PAGE_H - 18, { width: CW, align: 'center' });
        doc.text('COE', PAGE_W - M - 30, PAGE_H - 18);

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        if (!res.headersSent) {
            handleError(res, error, 'Error generating dispatch PDF');
        }
    }
};

// POST /admin/dispatch/absentees-report
const exportAbsenteesPDF = async (req, res) => {
    try {
        const { date, session, time, ampm, fromDate, toDate } = req.body;

        const start = fromDate || date;
        const end = toDate || date;

        if (!start || !session) {
            return res.status(400).json({ error: 'Start Date and Session are required' });
        }

        // 1. Fetch Departments mapping
        const deptsArr = await prisma.department.findMany();
        const deptMap = {};
        deptsArr.forEach(d => {
            const code = (d.code || '').toUpperCase();
            const name = (d.name || '').toUpperCase();
            const val = { fullName: d.name, degree: d.degree || 'B.E.' };
            if (code) deptMap[code] = val;
            if (name) deptMap[name] = val;
            if (code === 'MECH' || name.includes('MECHANICAL')) deptMap['MECH'] = val;
            if (code === 'CSE' || name.includes('COMPUTER SCIENCE')) deptMap['CSE'] = val;
            if (code === 'ECE' || name.includes('ELECTRONICS')) deptMap['ECE'] = val;
            if (code === 'EEE' || name.includes('ELECTRICAL')) deptMap['EEE'] = val;
        });

        // 2. Fetch All Allocations for the Range
        const allocations = await prisma.hallAllocation.findMany({
            where: {
                examDate: {
                    gte: new Date(new Date(start).setHours(0, 0, 0, 0)),
                    lte: new Date(new Date(end).setHours(23, 59, 59, 999))
                },
                session: session
            },
            include: {
                student: true,
                subject: true
            }
        });

        if (allocations.length === 0) {
            return res.status(404).json({ error: 'No allocations found for this range' });
        }

        const studentIds = allocations.map(a => a.studentId);
        const subjectIds = allocations.map(a => a.subjectId);
        const dummyMappings = await prisma.subjectDummyMapping.findMany({
            where: {
                studentId: { in: studentIds },
                subjectId: { in: subjectIds },
                isAbsent: true
            }
        });

        const absenteesMap = new Set(dummyMappings.map(d => `${d.studentId}_${d.subjectId}`));

        // 3. Group by [DeptName][Semester] -> [SubjectGroupings]
        const groups = {};
        allocations.forEach(a => {
            if (absenteesMap.has(`${a.studentId}_${a.subjectId}`)) {
                const shortDept = a.department || 'Unknown';
                const dInfo = deptMap[shortDept] || { fullName: shortDept, degree: 'B.E.' };
                const fullDept = `${dInfo.degree} ${dInfo.fullName}`;
                const sem = a.subject?.semester || '--';

                // Key for subject grouping: specific date + subjectId
                const dateKey = new Date(a.examDate).toISOString().split('T')[0];
                const subKey = `${dateKey}_${a.subjectId}`;

                if (!groups[fullDept]) groups[fullDept] = {};
                if (!groups[fullDept][sem]) groups[fullDept][sem] = {};
                if (!groups[fullDept][sem][subKey]) {
                    groups[fullDept][sem][subKey] = {
                        date: a.examDate,
                        session: a.session,
                        subject: a.subject,
                        students: []
                    };
                }
                groups[fullDept][sem][subKey].students.push(a.student);
            }
        });

        // 4. Generate PDF
        const MIET_LOGO = path.join(__dirname, '../../../client/public/miet-logo.png');
        const PAGE_W = 595.28;
        const PAGE_H = 841.89;
        const M = 40;
        const CW = PAGE_W - M * 2;

        const doc = new PDFDocument({ size: 'A4', margin: M });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="absentees_statement_${session}.pdf"`);
        doc.pipe(res);

        const renderHeader = (doc) => {
            const LOGO_SZ = 60;
            if (fs.existsSync(MIET_LOGO)) doc.image(MIET_LOGO, M, M, { width: LOGO_SZ });
            doc.font('Helvetica-Bold').fontSize(16).fillColor('black');
            doc.text('M.I.E.T. ENGINEERING COLLEGE', M, M, { width: CW, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(11).text('(Autonomous)', M, M + 18, { width: CW, align: 'center' });
            doc.font('Helvetica').fontSize(9).text('Affiliated to Anna University, Chennai', M, M + 31, { width: CW, align: 'center' });
            doc.text('TIRUCHIRAPPALLI - 620 007', M, M + 42, { width: CW, align: 'center' });
            doc.font('Helvetica-Bold').fontSize(13).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', M, M + 56, { width: CW, align: 'center' });
            doc.fontSize(12).text('ABSENTEES STATEMENT', M, M + 70, { width: CW, align: 'center' });
            doc.moveTo(M, M + 88).lineTo(PAGE_W - M, M + 88).lineWidth(1.2).stroke();
        };

        renderHeader(doc);
        let currentY = M + 105;

        const sortedDepts = Object.keys(groups).sort();
        if (sortedDepts.length === 0) {
            doc.moveDown(2);
            doc.font('Helvetica').fontSize(14).text('NO ABSENTEES MARKED FOR THIS PERIOD', { align: 'center' });
        } else {
            sortedDepts.forEach((deptTitle, dIdx) => {
                const sems = Object.keys(groups[deptTitle]).sort();
                sems.forEach((semNum, sIdx) => {
                    // Start New Page for Each Dept + Sem (except first)
                    if (dIdx > 0 || sIdx > 0) {
                        doc.addPage();
                        renderHeader(doc);
                        currentY = M + 105;
                    }

                    doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
                    doc.text(`Degree & Branch: ${deptTitle.toUpperCase()}`, M, currentY);
                    currentY += 16;
                    doc.text(`Semester: ${semNum}`, M, currentY);
                    currentY += 20;

                    // Sort subjects by date
                    const items = Object.values(groups[deptTitle][semNum]).sort((a, b) => new Date(a.date) - new Date(b.date));

                    items.forEach(item => {
                        const sub = item.subject;
                        const itemDate = new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                        const sessStr = `${itemDate} / ${item.session} (${time || ''} ${ampm || ''})`;

                        if (currentY > PAGE_H - 120) {
                            doc.addPage();
                            renderHeader(doc);
                            currentY = M + 105;
                        }

                        doc.font('Helvetica-Bold').fontSize(10);
                        doc.text(`Date & Session: ${sessStr}`, M + 15, currentY);
                        currentY += 15;
                        doc.text(`Subject: ${sub.code} - ${sub.name}`.toUpperCase(), M + 15, currentY);
                        currentY += 18;

                        // Table Header
                        const c1 = 40, c2 = 120;
                        doc.rect(M + 15, currentY, CW - 30, 18).fillColor('#f8f8f8').fillAndStroke();
                        doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
                        doc.text('S.No', M + 20, currentY + 5);
                        doc.text('Register Number', M + c1 + 25, currentY + 5);
                        doc.text('Student Name', M + c2 + 35, currentY + 5);
                        currentY += 18;

                        item.students.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber)).forEach((std, i) => {
                            if (currentY > PAGE_H - 60) {
                                doc.addPage();
                                renderHeader(doc);
                                currentY = M + 105;
                            }
                            doc.rect(M + 15, currentY, CW - 30, 18).stroke();
                            doc.font('Helvetica').fontSize(9);
                            doc.text(`${i + 1}`, M + 20, currentY + 5);
                            doc.text(std.registerNumber || '--', M + c1 + 25, currentY + 5);
                            doc.text(std.name || '--', M + c2 + 35, currentY + 5);
                            currentY += 18;
                        });
                        currentY += 20;
                    });
                });
            });
        }

        const sigY = PAGE_H - M - 60;
        doc.font('Helvetica-Bold').fontSize(11);
        doc.text('Signature of the Chief Superintendent', PAGE_W - M - 250, sigY, { width: 250, align: 'right' });

        doc.end();
    } catch (error) {
        console.error('Absentees Statement error:', error);
        if (!res.headersSent) handleError(res, error, 'Error generating absentees statement');
    }
};

module.exports = {
    getSubjectsForDispatch,
    getStudentsForDispatch,
    exportDispatchPDF,
    exportAbsenteesPDF,
    saveDispatchAbsentees,
    getAllocationDates,
    getSubjectsByAllocation
};
