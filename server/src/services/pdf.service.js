const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const COLLEGE_NAME = 'M.I.E.T. ENGINEERING COLLEGE';
const COLLEGE_NAME_BOLD = '(Autonomous)';
const COLLEGE_SUB = 'Affiliated to Anna University, Chennai';
const COLLEGE_CITY = 'TIRUCHIRAPPALLI - 620 007';
const CONTROLLER_LINE = 'OFFICE OF THE CONTROLLER OF EXAMINATIONS';
const MIET_LOGO = path.join(__dirname, '../../../client/public/miet-logo.png');

// ─── Helper: number to words ──────────────────────────────────────────────────
function numberToWords(num) {
    if (num == null || isNaN(num)) return '';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const n = Math.round(num);
    if (n === 0) return 'Zero';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
}

function romanize(num) {
    const val = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
    let result = '';
    let n = parseInt(num) || 0;
    for (const [r, v] of val) { while (n >= v) { result += r; n -= v; } }
    return result;
}

const drawLine = (doc, x1, y1, x2, y2) => doc.moveTo(x1, y1).lineTo(x2, y2).stroke();

// ─── Helper: draw MIET college header ────────────────
function drawMIETHeader(doc, startY) {
    const LOGO_SZ = 60;
    const MOriginal = 40;
    const PW = doc.page.width;

    if (fs.existsSync(MIET_LOGO)) {
        doc.image(MIET_LOGO, MOriginal, startY, { width: LOGO_SZ, height: LOGO_SZ });
    }

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000');
    doc.text(COLLEGE_NAME, 0, startY + 2, { width: PW, align: 'center' });
    doc.fontSize(12).text(COLLEGE_NAME_BOLD, 0, startY + 20, { width: PW, align: 'center' });
    doc.fontSize(9).font('Helvetica').text(COLLEGE_SUB, 0, startY + 36, { width: PW, align: 'center' });
    doc.text(COLLEGE_CITY, 0, startY + 46, { width: PW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).text(CONTROLLER_LINE, 0, startY + 60, { width: PW, align: 'center' });

    return startY + LOGO_SZ + 20;
}

// ─── THEORY: Statement of Marks PDF ──────────────────────────────────────────
exports.generateTheoryStatementOfMarks = (res, data) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
    doc.pipe(res);

    const M = 40;
    const CW = 515;
    const PAGE_STUDENTS = 25;
    const examYearText = data.examMonthYear || `NOV/DEC ${new Date().getFullYear()}`;
    const fullExamTitle = `${data.examTitleBase || 'END SEMESTER THEORY EXAMINATIONS'} ${examYearText}`;

    // data.groupedData is an array of { departmentCode, departmentName, students }
    data.groupedData.forEach((deptGroup) => {
        const entries = deptGroup.students || [];
        const totalPages = Math.ceil(entries.length / PAGE_STUDENTS) || 1;
        const deptName = (deptGroup.departmentName || '').toUpperCase();

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
            doc.addPage();
            let y = 25;
            y = drawMIETHeader(doc, y);

            // Centered Exam Title
            doc.font('Helvetica-Bold').fontSize(11).text(fullExamTitle, 0, y, { width: doc.page.width, align: 'center' });
            y += 18;
            doc.fontSize(12).text('STATEMENT OF MARKS', 0, y, { width: doc.page.width, align: 'center', underline: true });
            y += 20;

            // Info Table - Reorganized for Theory
            const col1 = M, col2 = M + 90, col3 = M + 280, col4 = M + 400;
            doc.font('Helvetica-Bold').fontSize(9);

            // Header: Degree & Department (FULL CAPS)
            doc.text(`${data.subject?.departmentRef?.degree || 'B.E.'} ${deptName}`, 0, y, { width: doc.page.width, align: 'center' });
            y += 20;

            // Row 1
            doc.font('Helvetica-Bold').text('COURSE CODE:', col1, y);
            doc.font('Helvetica').text(data.subject?.code || '', col2, y);
            doc.font('Helvetica-Bold').text('QP CODE:', col3, y);
            doc.font('Helvetica').text(data.qpCode || 'N/A', col4, y);
            y += 15;

            // Row 2
            doc.font('Helvetica-Bold').text('COURSE TITLE:', col1, y);
            doc.font('Helvetica').text(data.subject?.name || '', col2, y, { width: 180 });
            doc.font('Helvetica-Bold').text('PACKET NO:', col3, y);
            const packetBase = parseInt(data.packetNoBase) || 1;
            doc.font('Helvetica').text(`${packetBase + pageIdx}/${totalPages}`, col4, y);
            y += 20;

            // Row 3
            doc.font('Helvetica-Bold').text('SEMESTER:', col1, y);
            doc.font('Helvetica').text(romanize(data.subject?.semester) || '', col2, y);
            doc.font('Helvetica-Bold').text('DATE & SESSION:', col3, y);
            doc.font('Helvetica').text(data.dateSession || '', col4, y);
            y += 25;

            // Main Table
            const TW = CW;
            const c1 = 40, c2 = 120, c3 = 100, c4 = 255;
            const rowH = 20;

            // Draw Table Header
            doc.font('Helvetica-Bold').fontSize(9);
            doc.rect(M, y, TW, rowH).fillAndStroke('#f0f0f0', '#000000');
            doc.fillColor('#000000');
            doc.text('S.NO', M, y + 6, { width: c1, align: 'center' });
            doc.text('DUMMY NUMBER', M + c1, y + 6, { width: c2, align: 'center' });
            doc.text('MARKS (FIG)', M + c1 + c2, y + 6, { width: c3, align: 'center' });
            doc.text('MARKS IN WORDS', M + c1 + c2 + c3, y + 6, { width: c4, align: 'center' });

            // Vertical Lines for Header
            [c1, c1 + c2, c1 + c2 + c3].forEach(x => {
                doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
            });
            y += rowH;

            // Rows
            const pageRows = entries.slice(pageIdx * PAGE_STUDENTS, (pageIdx + 1) * PAGE_STUDENTS);
            for (let i = 0; i < PAGE_STUDENTS; i++) {
                const row = pageRows[i];
                doc.rect(M, y, TW, rowH).stroke();
                doc.font('Helvetica').fontSize(9);
                doc.text((pageIdx * PAGE_STUDENTS + i + 1).toString(), M, y + 6, { width: c1, align: 'center' });

                if (row) {
                    doc.text(row.dummyNumber || '', M + c1, y + 6, { width: c2, align: 'center' });
                    // Explicit check for marks
                    if (row.marks !== null && row.marks !== undefined) {
                        const mVal = parseFloat(row.marks);
                        doc.font('Helvetica-Bold').text(mVal.toString(), M + c1 + c2, y + 6, { width: c3, align: 'center' });
                        doc.font('Helvetica').text(numberToWords(mVal), M + c1 + c2 + c3 + 5, y + 6, { width: c4 - 10, align: 'left' });
                    }
                }

                // Vertical Lines for row
                [c1, c1 + c2, c1 + c2 + c3].forEach(x => {
                    doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
                });
                y += rowH;
            }

            // Footer Signatures
            const sigY = 780;
            doc.font('Helvetica-Bold').fontSize(9);
            doc.text('ASSISTANT EXAMINER', M, sigY);
            doc.text('EXAMINER', M, sigY, { width: CW, align: 'center' });
            doc.text('BOARD CHAIRMAN', M, sigY, { width: CW, align: 'right' });
        }
    });

    doc.end();
};

// ─── LAB: Statement of Marks PDF ─────────────────────────────────────────────
exports.generateLabStatementOfMarks = (res, data) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4', autoFirstPage: false });
    doc.pipe(res);

    const M = 40;
    const CW = 515;
    const PAGE_STUDENTS = 25;
    const examYearText = data.examMonthYear || `NOV/DEC ${new Date().getFullYear()}`;
    const fullExamTitle = `${data.examTitleBase || 'END SEMESTER PRACTICAL EXAMINATIONS'} ${examYearText}`;

    data.groupedData.forEach((deptGroup) => {
        const entries = deptGroup.students || [];
        const totalPages = Math.ceil(entries.length / PAGE_STUDENTS) || 1;
        const deptName = (deptGroup.departmentName || '').toUpperCase();

        for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
            doc.addPage();
            let y = 25;
            y = drawMIETHeader(doc, y);

            // Centered Title
            doc.font('Helvetica-Bold').fontSize(11).text(fullExamTitle, 0, y, { width: doc.page.width, align: 'center' });
            y += 20;
            doc.fontSize(12).text('STATEMENT OF MARKS', 0, y, { width: doc.page.width, align: 'center', underline: true });
            y += 20;

            // Header: Degree & Department (FULL CAPS)
            doc.font('Helvetica-Bold').fontSize(10).text(`${data.subject?.departmentRef?.degree || 'B.E.'} ${deptName}`, 0, y, { width: doc.page.width, align: 'center' });
            y += 20;

            // Info - Reorganized for Lab
            const l1 = M, l2 = M + 100, r1 = M + 280, r2 = M + 400;
            doc.font('Helvetica-Bold').fontSize(10);

            // Row 1
            doc.text('COURSE CODE:', l1, y);
            doc.font('Helvetica').text(data.subject?.code || '', l2, y);
            doc.font('Helvetica-Bold').text('DATE & SESSION:', r1, y);
            doc.font('Helvetica').text(data.dateSession || '', r2, y);
            y += 18;

            // Row 2
            doc.font('Helvetica-Bold').text('COURSE TITLE:', l1, y);
            doc.font('Helvetica').text(data.subject?.name || '', l2, y, { width: 170 });
            doc.font('Helvetica-Bold').text('SEMESTER:', r1, y);
            doc.font('Helvetica').text(romanize(data.subject?.semester) || '', r2, y);
            y += 25;

            // Table
            const TW = CW;
            const col_sno = 40, col_reg = 120, col_name = 280, col_mark = 75;
            const rowH = 20;

            // Table Header
            doc.font('Helvetica-Bold').fontSize(9);
            doc.rect(M, y, TW, rowH).fillAndStroke('#f0f0f0', '#000000');
            doc.fillColor('#000000');
            doc.text('S.NO', M, y + 6, { width: col_sno, align: 'center' });
            doc.text('REGISTER NO', M + col_sno, y + 6, { width: col_reg, align: 'center' });
            doc.text('STUDENT NAME', M + col_sno + col_reg, y + 6, { width: col_name, align: 'center' });
            doc.text('MARKS', M + col_sno + col_reg + col_name, y + 6, { width: col_mark, align: 'center' });

            [col_sno, col_sno + col_reg, col_sno + col_reg + col_name].forEach(x => {
                doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
            });
            y += rowH;

            // Rows
            const pageRows = entries.slice(pageIdx * PAGE_STUDENTS, (pageIdx + 1) * PAGE_STUDENTS);
            for (let i = 0; i < PAGE_STUDENTS; i++) {
                const row = pageRows[i];
                doc.rect(M, y, TW, rowH).stroke();
                doc.font('Helvetica').fontSize(9);
                doc.text((pageIdx * PAGE_STUDENTS + i + 1).toString(), M, y + 6, { width: col_sno, align: 'center' });

                if (row) {
                    doc.text(row.registerNumber || '', M + col_sno, y + 6, { width: col_reg, align: 'center' });
                    doc.text(row.name || '', M + col_sno + col_reg + 5, y + 6, { width: col_name - 10, align: 'left' });
                    if (row.marks !== null && row.marks !== undefined) {
                        const mVal = parseFloat(row.marks);
                        doc.font('Helvetica-Bold').text(mVal.toString(), M + col_sno + col_reg + col_name, y + 6, { width: col_mark, align: 'center' });
                    }
                }

                [col_sno, col_sno + col_reg, col_sno + col_reg + col_name].forEach(x => {
                    doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
                });
                y += rowH;
            }

            // Footer
            const sigY = 780;
            const fw = CW / 2;
            doc.font('Helvetica-Bold').fontSize(10);
            doc.text('Signature of Internal Examiner', M, sigY, { width: fw, align: 'center' });
            doc.text('Signature of External Examiner', M + fw, sigY, { width: fw, align: 'center' });
        }
    });

    doc.end();
};

exports.generateProvisionalResultsPortrait = (res, data) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);

    const M = 30;
    const CW = doc.page.width - 2 * M;
    let y = 30;

    // Header
    y = drawMIETHeader(doc, y);
    doc.moveDown(0.5);
    y = doc.y;

    const title = `PROVISIONAL RESULTS - ${data.examSession || 'NOV/DEC ' + new Date().getFullYear()}`;
    doc.font('Helvetica-Bold').fontSize(12).text(title, M, y, { width: CW, align: 'center' });
    y += 20;

    // Sub-info
    doc.fontSize(10);
    doc.text(`DEGREE & BRANCH: ${data.fullDepartmentName || data.department}`, M, y);
    doc.text(`SEMESTER: ${data.semester}`, M + 400, y);
    y += 15;
    doc.text(`REGULATION: ${data.regulation || '2021'}`, M, y);
    if (data.publishedAt) {
        doc.text(`Date of Publication: ${data.publishedAt}`, M + 350, y);
    }
    y += 25;

    // Table Headers
    const colWidths = {
        sno: 30,
        regno: 90,
        name: 120,
        subject: 45, // Dynamic based on subject count
        gpa: 35,
        result: 50
    };

    const subjects = data.subjects || [];
    const subCount = subjects.length;
    const availWidth = CW - colWidths.sno - colWidths.regno - colWidths.name - colWidths.gpa - colWidths.result;
    const subWidth = subCount > 0 ? Math.floor(availWidth / subCount) : 0;

    const drawRow = (row, isHeader = false) => {
        const rowH = isHeader ? 30 : 25;
        if (y + rowH > doc.page.height - 50) {
            doc.addPage();
            y = 30;
        }

        doc.rect(M, y, CW, rowH).stroke();
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);

        let curX = M;
        // Verticals
        [colWidths.sno, colWidths.regno, colWidths.name].forEach(w => {
            doc.moveTo(curX + w, y).lineTo(curX + w, y + rowH).stroke();
            curX += w;
        });

        // Subject columns verticals
        for (let i = 0; i < subCount; i++) {
            doc.moveTo(curX + subWidth, y).lineTo(curX + subWidth, y + rowH).stroke();
            curX += subWidth;
        }

        // GPA vertical
        doc.moveTo(curX + colWidths.gpa, y).lineTo(curX + colWidths.gpa, y + rowH).stroke();

        // Content
        curX = M;
        doc.text(row.sno || '', curX, y + (rowH / 2) - 4, { width: colWidths.sno, align: 'center' });
        curX += colWidths.sno;
        doc.text(row.regno || '', curX + 2, y + (rowH / 2) - 4, { width: colWidths.regno - 4, align: 'center' });
        curX += colWidths.regno;
        doc.text(row.name || '', curX + 5, y + (rowH / 2) - 4, { width: colWidths.name - 10, align: 'left' });
        curX += colWidths.name;

        // Grades
        if (isHeader) {
            subjects.forEach(sub => {
                doc.fontSize(7).text(sub.code, curX, y + 5, { width: subWidth, align: 'center' });
                doc.fontSize(6).text(`(${sub.credits})`, curX, y + 16, { width: subWidth, align: 'center' });
                curX += subWidth;
            });
        } else {
            subjects.forEach(sub => {
                const grade = row.marks[sub.code]?.grade || '-';
                doc.text(grade, curX, y + (rowH / 2) - 4, { width: subWidth, align: 'center' });
                curX += subWidth;
            });
        }

        doc.fontSize(8).text(row.gpa || '', curX, y + (rowH / 2) - 4, { width: colWidths.gpa, align: 'center' });
        curX += colWidths.gpa;
        doc.text(row.result || '', curX, y + (rowH / 2) - 4, { width: colWidths.result, align: 'center' });

        y += rowH;
    };

    // Header Row
    drawRow({
        sno: 'S.NO',
        regno: 'REGISTER NO',
        name: 'STUDENT NAME',
        gpa: 'GPA',
        result: 'RESULT'
    }, true);

    // Data Rows
    data.students.forEach(student => {
        drawRow({
            sno: student.sno,
            regno: student.registerNumber,
            name: student.name,
            marks: student.marks,
            gpa: student.gpa?.toFixed(2),
            result: student.resultStatus
        });
    });

    doc.end();
};

exports.generateConsolidatedTabulationSheet = (res, data) => {
    // A3 Landscape T-Sheet Redesign - "EXACTLY LIKE THESE"
    const doc = new PDFDocument({ margin: 20, size: 'A3', layout: 'landscape' });
    doc.pipe(res);

    const M = 30;
    const CW = doc.page.width - 2 * M;
    let y = 30;

    // --- MIET Official Header ---
    y = drawMIETHeader(doc, y);
    doc.moveDown(0.2);
    y = doc.y;

    // --- Degree & Branch Header Line (Matching image) ---
    doc.font('Helvetica-Bold').fontSize(11).text((data.fullDepartmentName || data.department).toUpperCase(), M, y, { width: CW, align: 'center' });
    y += 18;

    doc.fontSize(10).text(`PROVISIONAL RESULTS OF ${examSession.toUpperCase()}`, M, y, { width: CW, align: 'center' });
    y += 20;

    // --- Info Bar ---
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`Semester : ${data.semester || ''}`, M, y);
    doc.text(`R-${data.regulation || '2021'}`, M + 200, y);
    const pubDate = data.publishedAt || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    doc.text(`Date of Publication : ${pubDate}`, M + 400, y);
    y += 15;

    const subjects = data.subjects || [];

    // Table configuration
    const colWidths = { sno: 25, regno: 70, name: 110 };
    const statCols = { gpa: 35, cr: 30, result: 50 };
    const fixedWidthStart = colWidths.sno + colWidths.regno + colWidths.name;
    const fixedWidthEnd = statCols.gpa + statCols.cr + statCols.result;
    const totalAvail = CW - fixedWidthStart - fixedWidthEnd - 5;

    // Sub-column counts: Integrated (6), Theory/Lab (5)
    // Labels: Int, Ext/PE/TE, Total, A-Grade, R-Grade
    const subColCounts = subjects.map(s => s.subjectCategory === 'INTEGRATED' ? 6 : 5);
    const totalSubCols = subColCounts.reduce((a, b) => a + b, 0);
    const unitWidth = totalSubCols > 0 ? (totalAvail / totalSubCols) : 0;

    const drawLineLocal = (x1, y1, x2, y2) => doc.moveTo(x1, y1).lineTo(x2, y2).stroke();

    const drawTableHeader = () => {
        const h1 = 15; // Row 1: Subject Code
        const h2 = 25; // Row 2: Labels
        const h3 = 12; // Row 3: Max Marks
        const totalH = h1 + h2 + h3;

        doc.rect(M, y, CW, totalH).stroke();
        doc.font('Helvetica-Bold').fontSize(7);

        let curX = M;
        // Verticals for fixed start (S.No, RegNo, Name span all 3 rows)
        const fixed = [
            { w: colWidths.sno, val: 'S.No' },
            { w: colWidths.regno, val: 'Register No' },
            { w: colWidths.name, val: 'Student Name' }
        ];

        fixed.forEach(f => {
            doc.text(f.val, curX, y + (totalH / 2) - 4, { width: f.w, align: 'center' });
            drawLineLocal(curX + f.w, y, curX + f.w, y + totalH);
            curX += f.w;
        });

        // Subject columns
        subjects.forEach((sub, i) => {
            const cols = subColCounts[i];
            const blockW = unitWidth * cols;
            const subCW = blockW / cols;

            // Row 1: Code
            doc.fontSize(7).text(sub.code, curX, y + 4, { width: blockW, align: 'center' });
            drawLineLocal(curX, y + h1, curX + blockW, y + h1);

            // Row 2: Labels
            const labels = (cols === 6) ? ['Int', 'P-E', 'T-E', 'Tot', 'A-G', 'R-G'] : ['Int', 'Ext', 'Tot', 'A-G', 'R-G'];
            labels.forEach((l, idx) => {
                doc.fontSize(6).text(l, curX + (idx * subCW), y + h1 + 8, { width: subCW, align: 'center' });
                if (idx > 0) drawLineLocal(curX + (idx * subCW), y + h1, curX + (idx * subCW), y + totalH);
            });
            drawLineLocal(curX, y + h1 + h2, curX + blockW, y + h1 + h2);

            // Row 3: Max Marks
            doc.fontSize(5.5).fillColor('#444');
            const maxMarks = (cols === 6)
                ? ['50', '100(50)', '100(50)', '100', '-', '-']
                : (sub.subjectCategory === 'LAB' ? ['60', '100(40)', '100', '-', '-'] : ['40', '100(60)', '100', '-', '-']);

            maxMarks.forEach((m, idx) => {
                doc.text(m, curX + (idx * subCW), y + h1 + h2 + 2, { width: subCW, align: 'center' });
            });
            doc.fillColor('#000');

            drawLineLocal(curX + blockW, y, curX + blockW, y + totalH);
            curX += blockW;
        });

        // End stats
        const stats = ['GPA', 'CR', 'RESULT'];
        const sKeys = Object.keys(statCols);
        stats.forEach((s, idx) => {
            const w = statCols[sKeys[idx]];
            doc.fontSize(7).text(s, curX, y + (totalH / 2) - 4, { width: w, align: 'center' });
            if (idx < stats.length - 1) drawLineLocal(curX + w, y, curX + w, y + totalH);
            curX += w;
        });

        y += totalH;
    };

    const drawDataRow = (row) => {
        const rowH = 22;
        if (y + rowH > doc.page.height - 60) {
            doc.addPage();
            y = 30;
            drawTableHeader();
        }

        doc.rect(M, y, CW, rowH).stroke();
        doc.font('Helvetica').fontSize(7.5);

        let curX = M;
        // Fixed start
        doc.text(String(row.sno || ''), curX, y + 7, { width: colWidths.sno, align: 'center' }); curX += colWidths.sno; drawLineLocal(curX, y, curX, y + rowH);
        doc.text(String(row.regno || ''), curX, y + 7, { width: colWidths.regno, align: 'center' }); curX += colWidths.regno; drawLineLocal(curX, y, curX, y + rowH);
        doc.fontSize(7).text(String(row.name || ''), curX + 2, y + 7, { width: colWidths.name - 4, align: 'left' }); curX += colWidths.name; drawLineLocal(curX, y, curX, y + rowH);

        // Subject marks
        subjects.forEach((sub, i) => {
            const cols = subColCounts[i];
            const blockW = unitWidth * cols;
            const subCW = blockW / cols;
            const marks = row.marks[sub.code] || {};

            const vals = (cols === 6)
                ? [marks.internal, marks.labExt, marks.theoryExt, marks.total, marks.grade, marks.grade]
                : [marks.internal, marks.external, marks.total, marks.grade, marks.grade];

            vals.forEach((v, idx) => {
                const isGrade = (idx >= vals.length - 2);
                doc.fontSize(isGrade ? 7 : 7.5);
                if (isGrade) doc.font('Helvetica-Bold');

                doc.text(v?.toString() || '-', curX + (idx * subCW), y + 7, { width: subCW, align: 'center' });
                doc.font('Helvetica');
                if (idx > 0) drawLineLocal(curX + (idx * subCW), y, curX + (idx * subCW), y + rowH);
            });
            drawLineLocal(curX + blockW, y, curX + blockW, y + rowH);
            curX += blockW;
        });

        // Stats end
        const sVals = [row.gpa, row.earnedCredits, row.resultStatus];
        const sKeys = Object.keys(statCols);
        sVals.forEach((s, idx) => {
            const w = statCols[sKeys[idx]];
            if (idx === 3) {
                if (s === 'PASS') doc.fillColor('#008000');
                else if (s === 'FAIL') doc.fillColor('#AA0000');
            }
            doc.text(String(s || ''), curX, y + 7, { width: w, align: 'center' });
            doc.fillColor('#000');
            if (idx < sVals.length - 1) drawLineLocal(curX + w, y, curX + w, y + rowH);
            curX += w;
        });

        y += rowH;
    };

    // Initial table header
    drawTableHeader();

    // Data rows
    data.students.forEach((s, idx) => {
        drawDataRow({
            sno: (idx + 1),
            regno: s.registerNumber,
            name: s.name,
            marks: s.marks,
            gpa: s.gpa?.toFixed(2),
            cgpa: s.cgpa?.toFixed(2),
            earnedCredits: s.earnedCredits?.toString(),
            resultStatus: s.resultStatus
        });
    });

    // Footnotes: Signatures
    const sigY = doc.page.height - 60;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Prepared By', M + 50, sigY);
    doc.text('Verified By', M + 500, sigY);
    doc.text('Controller of Examinations', CW - 150, sigY);

    doc.end();
};

// ── Hall Ticket PDF ───────────────────────────────────────────────────────────
exports.generateHallTicket = (res, data) => {
    const students = data.students || [];
    const sessionName = data.sessionName || '';
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    const PW = doc.page.width;
    const PH = doc.page.height;
    const M = 28;
    const CW = PW - 2 * M;
    const TICKET_H = PH - 2 * M;

    const drawTicket = (student, startY) => {
        // Outer border
        doc.rect(M, startY + 4, CW, TICKET_H - 12).stroke();
        let y = startY + 8;

        // Logo
        const LOGO_SZ = 50;
        if (fs.existsSync(MIET_LOGO)) {
            doc.image(MIET_LOGO, M + 6, y, { width: LOGO_SZ, height: LOGO_SZ });
        }

        // Photo box (top-right)
        const PHOTO_W = 65, PHOTO_H = 75;
        const photoX = M + CW - PHOTO_W - 10;
        doc.rect(photoX, y, PHOTO_W, PHOTO_H).stroke();

        const photoPath = student.photo ? path.join(__dirname, '../../uploads/students', student.photo) : null;
        if (photoPath && fs.existsSync(photoPath)) {
            doc.image(photoPath, photoX + 2, y + 2, { fit: [PHOTO_W - 4, PHOTO_H - 4] });
        } else {
            doc.fontSize(7).text('PHOTO', photoX, y + PHOTO_H / 2, { width: PHOTO_W, align: 'center' });
        }

        // College header (centered)
        const TX = M + LOGO_SZ + 8;
        const TW = CW - LOGO_SZ - PHOTO_W - 20;
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#000').text('M.I.E.T. ENGINEERING COLLEGE', TX, y + 2, { width: TW, align: 'center' });
        doc.fontSize(10).text('(Autonomous)', TX, y + 16, { width: TW, align: 'center' });
        doc.font('Helvetica').fontSize(8).text('Affiliated to Anna University, Chennai', TX, y + 28, { width: TW, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(10).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', TX, y + 42, { width: TW, align: 'center' });
        const cleanSessionName = sessionName.replace(/END SEMESTER/gi, '').replace(/EXAMINATIONS/gi, '').replace(/\s+/g, ' ').trim();
        doc.fontSize(10).text(`UG/PG DEGREE END SEMESTER EXAMINATIONS ${cleanSessionName}`, TX, y + 56, { width: TW, align: 'center' });
        y += Math.max(LOGO_SZ, PHOTO_H) + 2;

        // Divider
        doc.moveTo(M + 4, y).lineTo(M + CW - 4, y).stroke();
        y += 4;

        // HALL TICKET title
        doc.font('Helvetica-Bold').fontSize(12).text('HALL TICKET', M, y, { width: CW, align: 'center', underline: true });
        y += 16;

        // Student info table (bordered grid)
        const rowH = 16;
        const col1 = 120, col2 = 230, col3 = 80, col4 = CW - col1 - col2 - col3;

        // Row 1: Reg No | Semester
        doc.rect(M, y, col1, rowH).stroke();
        doc.rect(M + col1, y, col2, rowH).stroke();
        doc.rect(M + col1 + col2, y, col3, rowH).stroke();
        doc.rect(M + col1 + col2 + col3, y, col4, rowH).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('Registration Number', M + 4, y + 4);
        doc.font('Helvetica').fontSize(9).text(student.registerNumber || student.rollNo || '-', M + col1 + 4, y + 4);
        doc.font('Helvetica-Bold').fontSize(9).text('Semester', M + col1 + col2 + 4, y + 4);
        doc.font('Helvetica').fontSize(9).text(String(student.semester || '-'), M + col1 + col2 + col3 + 4, y + 4);
        y += rowH;

        // Row 2: Name
        doc.rect(M, y, col1, rowH).stroke();
        doc.rect(M + col1, y, col2 + col3 + col4, rowH).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('Name', M + 4, y + 4);
        doc.font('Helvetica').fontSize(9).text(student.name || '-', M + col1 + 4, y + 4);
        y += rowH;

        // Row 3: Degree & Branch | Date of Birth
        doc.rect(M, y, col1, rowH).stroke();
        doc.rect(M + col1, y, col2, rowH).stroke();
        doc.rect(M + col1 + col2, y, col3, rowH).stroke();
        doc.rect(M + col1 + col2 + col3, y, col4, rowH).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('Degree & Branch', M + 4, y + 4);
        const degreeText = `${student.departmentRef?.degree || 'B.E.'}. ${student.departmentRef?.name || student.department || ''}`;
        doc.font('Helvetica').fontSize(9).text(degreeText, M + col1 + 4, y + 4, { width: col2 - 8 });
        doc.font('Helvetica-Bold').fontSize(9).text('Date of Birth', M + col1 + col2 + 4, y + 4);
        const dob = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : '-';
        doc.font('Helvetica').fontSize(9).text(dob, M + col1 + col2 + col3 + 4, y + 4);
        y += rowH;

        y += 4;

        // Subjects table header
        const colW = [30, 70, 55, 65, 55, CW - 30 - 70 - 55 - 65 - 55];
        const hdrs = ['Sl.No', 'Date', 'Session', 'Sub.Code', 'semester', 'Subject Title'];
        const subH = 18;
        doc.rect(M, y, CW, subH).fillAndStroke('#F2F2F2', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(8.5);
        let cx = M;
        hdrs.forEach((h, i) => {
            doc.rect(cx, y, colW[i], subH).stroke();
            doc.text(h, cx + 2, y + 5, { width: colW[i] - 4, align: 'center' });
            cx += colW[i];
        });
        doc.fillColor('#000');
        y += subH;

        // Subject rows
        (student.subjects || []).forEach((sub, idx) => {
            doc.rect(M, y, CW, 16).stroke();
            doc.font('Helvetica').fontSize(8.5).fillColor('#000');
            let cx2 = M;
            const vals = [
                String(idx + 1),
                sub.examDate || '',
                sub.session || '',
                sub.code || '',
                String(student.semester || ''),
                sub.name || ''
            ];
            vals.forEach((v, i) => {
                doc.rect(cx2, y, colW[i], 16).stroke();
                doc.text(v, cx2 + 2, y + 4, { width: colW[i] - 4, align: i === 5 ? 'left' : 'center' });
                cx2 += colW[i];
            });
            y += 16;
        });

        y += 6;

        // No. of Subjects Registered
        y += 6;
        doc.moveTo(M + 4, y).lineTo(M + CW - 4, y).stroke();
        y += 4;
        doc.font('Helvetica-Bold').fontSize(8.5).text(`No. of Subjects Registered : ${(student.subjects || []).length}`, M + 12, y);

        // Signatures
        const sigY = startY + TICKET_H - 60;
        doc.font('Helvetica').fontSize(9);
        doc.text('Signature of the Candidate', M + 14, sigY);
        doc.font('Helvetica-Bold').text('Controller of Examinations', M, sigY, { width: CW - 14, align: 'right' });

        // Note
        doc.fontSize(8).font('Helvetica').text('Note: If any discrepancies are found in the Hall Ticket, report to the Admin office immediately.', M + 14, sigY + 24);
    };

    students.forEach((student, i) => {
        if (i > 0) doc.addPage();
        drawTicket(student, M);
    });
    doc.end();
};
// ─── HALL APPLICATION ────────────────────────────────────────────────────────
exports.generateHallApplication = (res, data) => {
    const students = data.students || [];
    const sessionName = data.sessionName || '';
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    const M = 30;
    const CW = doc.page.width - 2 * M;

    const drawApplication = (student) => {
        let y = 20;

        // Outer border
        doc.rect(M, y, CW, doc.page.height - 40).stroke();
        y += 6;

        // Logo
        const LOGO_SZ = 55;
        if (fs.existsSync(MIET_LOGO)) {
            doc.image(MIET_LOGO, M + 6, y, { width: LOGO_SZ, height: LOGO_SZ });
        }

        // Photo box
        const PHOTO_W = 70, PHOTO_H = 85;
        const photoX = M + CW - PHOTO_W - 10;
        doc.rect(photoX, y, PHOTO_W, PHOTO_H).stroke();

        const photoPath = student.photo ? path.join(__dirname, '../../uploads/students', student.photo) : null;
        if (photoPath && fs.existsSync(photoPath)) {
            doc.image(photoPath, photoX + 2, y + 2, { fit: [PHOTO_W - 4, PHOTO_H - 4] });
        } else {
            doc.fontSize(8).text('PHOTO', photoX, y + PHOTO_H / 2, { width: PHOTO_W, align: 'center' });
        }

        // Header text
        const TX = M + LOGO_SZ + 8;
        const TW = CW - LOGO_SZ - PHOTO_W - 20;
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000').text('M.I.E.T. ENGINEERING COLLEGE', TX, y + 2, { width: TW, align: 'center' });
        doc.fontSize(10).text('(Autonomous)', TX, y + 18, { width: TW, align: 'center' });
        doc.font('Helvetica').fontSize(8.5).text('Affiliated to Anna University, Chennai', TX, y + 30, { width: TW, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(10).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', TX, y + 42, { width: TW, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(10).text(`APPLICATION FOR SEMESTER EXAMINATIONS ${sessionName}`, TX, y + 55, { width: TW, align: 'center' });
        y += Math.max(LOGO_SZ, PHOTO_H) + 15;

        doc.moveTo(M + 4, y).lineTo(M + CW - 4, y).stroke();
        y += 6;

        // Student info — 2 column layout
        const halfW = (CW - 10) / 2;
        const lw = 95, vw = halfW - lw - 5;
        const rowH = 16;

        const leftInfo = [
            ['Register Number', student.registerNumber || student.rollNo],
            ["Student's Name", student.name || ''],
            ['Date Of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : ''],
            ['Degree & Branch', `${student.departmentRef?.degree || 'B.E.'} - ${student.departmentRef?.name || student.department || ''}`],
        ];
        const rightInfo = [
            ['Year/Semester', `${student.year || ''} / ${student.semester || ''}`],
            ['Gender', student.gender || ''],
            ['Regulations', student.regulation || '2021'],
            ['Mobile Number', student.phoneNumber || ''],
        ];

        // Student details grid
        leftInfo.forEach((row, i) => {
            const fy = y + i * rowH;
            doc.rect(M + 4, fy, halfW, rowH).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text(String(row[0]), M + 8, fy + 4, { width: lw - 4 });
            doc.font('Helvetica').fontSize(8).text(`: ${String(row[1] || '')}`, M + 4 + lw, fy + 4, { width: vw + 4 });
        });
        rightInfo.forEach((row, i) => {
            const fy = y + i * rowH;
            const rx = M + 4 + halfW;
            doc.rect(rx, fy, halfW + 4, rowH).stroke();
            doc.font('Helvetica-Bold').fontSize(8).text(String(row[0]), rx + 4, fy + 4, { width: lw - 4 });
            doc.font('Helvetica').fontSize(8).text(`: ${String(row[1] || '')}`, rx + lw, fy + 4, { width: vw + 8 });
        });
        y += leftInfo.length * rowH + 8;

        // Subject table header
        const subjColW = [30, 65, 180, 30, 65, 170];
        const subjHdrs = ['Sem', 'Course Code', 'Course Title', 'Sem', 'Course Code', 'Course Title'];
        const subjH = 16;
        doc.rect(M + 4, y, CW - 8, subjH).fillAndStroke('#e8e8e8', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(8);
        let sx = M + 4;
        subjHdrs.forEach((h, i) => {
            doc.text(h, sx + 2, y + 4, { width: subjColW[i] - 4, align: 'center' });
            sx += subjColW[i];
        });
        y += subjH;

        // Sort subjects: theory, lab/practical, arrear
        const subjects = student.subjects || [];
        const theorySubjects = subjects.filter(s => s.subjectCategory === 'THEORY' || s.subjectCategory === 'INTEGRATED');
        const labSubjects = subjects.filter(s => s.subjectCategory === 'LAB');
        const arrearSubjects = subjects.filter(s => s.isArrear);
        const allSubjects = [...theorySubjects, ...labSubjects, ...arrearSubjects];

        // Two-column rows
        const half = Math.ceil(allSubjects.length / 2);
        const leftSubjects = allSubjects.slice(0, half);
        const rightSubjects = allSubjects.slice(half);
        const maxRows = Math.max(leftSubjects.length, rightSubjects.length);

        for (let i = 0; i < maxRows; i++) {
            const ls = leftSubjects[i];
            const rs = rightSubjects[i];
            doc.rect(M + 4, y, CW - 8, 14).stroke();
            doc.font('Helvetica').fontSize(8).fillColor('#000');
            let cx = M + 4;
            // Left side
            doc.text(ls ? String(ls.semester || student.semester || '') : '', cx + 2, y + 3, { width: subjColW[0] - 4, align: 'center' }); cx += subjColW[0];
            doc.text(ls ? ls.code || '' : '', cx + 2, y + 3, { width: subjColW[1] - 4, align: 'center' }); cx += subjColW[1];
            doc.text(ls ? ls.name || '' : '', cx + 2, y + 3, { width: subjColW[2] - 4, align: 'left' }); cx += subjColW[2];
            // Right side
            doc.text(rs ? String(rs.semester || student.semester || '') : '', cx + 2, y + 3, { width: subjColW[3] - 4, align: 'center' }); cx += subjColW[3];
            doc.text(rs ? rs.code || '' : '', cx + 2, y + 3, { width: subjColW[4] - 4, align: 'center' }); cx += subjColW[4];
            doc.text(rs ? rs.name || '' : '', cx + 2, y + 3, { width: subjColW[5] - 4, align: 'left' });
            y += 14;
        }

        // Pinned to bottom sections (Total -> Decl -> Sigs -> Note)
        const footerStartY = doc.page.height - 200;
        let fy = footerStartY;

        // Totals row
        const theoryTotal = theorySubjects.length + (allSubjects.filter(s => s.isArrear && s.subjectCategory !== 'LAB').length);
        const practicalTotal = labSubjects.length + (allSubjects.filter(s => s.isArrear && s.subjectCategory === 'LAB').length);
        const totalPapers = allSubjects.length;

        doc.rect(M + 4, fy, CW - 8, 16).fillAndStroke('#f0f0f0', '#000');
        doc.fillColor('#000').font('Helvetica-Bold').fontSize(8);
        const col1 = (CW - 8) * 0.25;
        const col2 = (CW - 8) * 0.1;
        const col3 = (CW - 8) * 0.25;
        const col4 = (CW - 8) * 0.1;
        const col5 = (CW - 8) * 0.2;
        const col6 = (CW - 8) * 0.1;

        let tx = M + 4;
        doc.text('Theory Total', tx, fy + 4, { width: col1, align: 'center' }); tx += col1; drawLine(doc, tx, fy, tx, fy + 16);
        doc.text(String(theoryTotal), tx, fy + 4, { width: col2, align: 'center' }); tx += col2; drawLine(doc, tx, fy, tx, fy + 16);
        doc.text('Practical Total', tx, fy + 4, { width: col3, align: 'center' }); tx += col3; drawLine(doc, tx, fy, tx, fy + 16);
        doc.text(String(practicalTotal), tx, fy + 4, { width: col4, align: 'center' }); tx += col4; drawLine(doc, tx, fy, tx, fy + 16);
        doc.text('Total No Of Papers', tx, fy + 4, { width: col5, align: 'center' }); tx += col5; drawLine(doc, tx, fy, tx, fy + 16);
        doc.text(String(totalPapers), tx, fy + 4, { width: col6, align: 'center' });
        fy += 26;

        // 3 Signature boxes
        const sigBoxW = (CW - 8) / 3;
        ['Signature of the Candidate', 'Signature of the Class Coordinator', 'Recommended & forwarded to Office of CoE by HoD'].forEach((label, i) => {
            const bx = M + 4 + i * sigBoxW;
            doc.rect(bx, fy, sigBoxW, 55).stroke();

            if (i === 0) {
                doc.font('Helvetica').fontSize(7.5).text('I hereby declare that the particulars furnished by me in this application are correct', bx + 4, fy + 4, { width: sigBoxW - 8, align: 'left' });
            }

            doc.font('Helvetica').fontSize(7).text(label, bx + 2, fy + 42, { width: sigBoxW - 4, align: 'center' });
        });
        fy += 62;

        // Session times
        doc.font('Helvetica-Bold').fontSize(8.5);
        doc.text('FN - FORENOON 10.00 AM - 1.00 PM', M + 6, fy);
        doc.text('AN - AFTERNOON 2.00 PM - 5.00 PM', M + 6, fy, { width: CW - 10, align: 'right' });
        fy += 16;

        // Accepted/Rejected
        const arW = 150;
        const arX = M + (CW - arW) / 2;
        doc.rect(arX, fy, arW, 18).stroke();
        doc.font('Helvetica-Bold').fontSize(9).text('ACCEPTED / REJECTED', arX, fy + 5, { width: arW, align: 'center' });
        fy += 24;

        // If Rejected line
        doc.font('Helvetica').fontSize(9).text('If Rejected, Reason:', M + 4, fy + 4);
        doc.rect(M + 90, fy, CW - 100, 18).stroke();
        fy += 32;

        // Note
        doc.fontSize(8.5).font('Helvetica-Bold').text('Note :', M + 4, fy + 12);
        doc.font('Helvetica').fontSize(8.5).text('1. If any discrepancy is found in the form, report to office of CoE immediately.', M + 35, fy + 12);
        doc.font('Helvetica-Bold').fontSize(9.5).text('Controller of Examinations', M + 4, fy + 12, { width: CW - 8, align: 'right' });
    };

    students.forEach((student, idx) => {
        if (idx > 0) doc.addPage();
        drawApplication(student);
    });
    doc.end();
};

// ── Exam Attendance Sheet PDF ─────────────────────────────────────────────────
exports.generateExamAttendanceSheet = (res, data) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30, autoFirstPage: false });
    doc.pipe(res);

    const CW = 535;
    const M = 30;
    const LOGO_SZ = 50;

    const halls = data.halls || [];
    const PAGE_ROWS = 25;

    halls.forEach((hall) => {
        const depts = hall.depts || [];

        depts.forEach((dept) => {
            const rows = dept.entries || [];
            const totalPages = Math.ceil(rows.length / PAGE_ROWS) || 1;

            for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                doc.addPage();

                // Outer page border
                doc.rect(M - 10, M - 10, CW + 20, 780).stroke();

                let y = 30;

                // Logo
                const logoPath = path.join(__dirname, '../../../client/public/miet-logo.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, M + (data.examMode === 'LAB' ? 10 : 0), y + (data.examMode === 'LAB' ? 5 : 0), { width: LOGO_SZ + (data.examMode === 'LAB' ? 10 : 0) });
                }

                if (data.examMode === 'LAB') {
                    doc.font('Helvetica-Bold').fontSize(14).fillColor('#000').text('M.I.E.T. ENGINEERING COLLEGE', M, y, { width: CW, align: 'center' });
                    doc.fontSize(10).text('(AUTONOMOUS)', M, y + 15, { width: CW, align: 'center' });
                    doc.font('Helvetica').fontSize(10).text('(AFFILIATED TO ANNA UNIVERSITY, CHENNAI)', M, y + 27, { width: CW, align: 'center' });
                    doc.fontSize(10).text('TIRUCHIRAPPALLI', M, y + 40, { width: CW, align: 'center' });

                    y += LOGO_SZ + 15;
                    doc.font('Helvetica-Bold').fontSize(11).text('EXAMINATION PRACTICAL ATTENDANCE SHEET', M, y, { width: CW, align: 'center' });
                    y += 20;

                    const c1 = M, c2 = M + 110, c3 = M + 380, c4 = M + 470;
                    doc.font('Helvetica-Bold').fontSize(8);

                    doc.text('Branch Name', c1, y);
                    doc.font('Helvetica').text(`: ${dept.deptName || data.department || ''}`, c2, y);
                    doc.font('Helvetica-Bold').text('Date of Examination', c3, y);
                    doc.font('Helvetica').text(`: ${data.dateSession ? data.dateSession.split('/')[0].trim() : ''}`, c4, y);
                    y += 18;

                    doc.font('Helvetica-Bold').text('Subject Code/Name', c1, y);
                    doc.font('Helvetica').text(`: ${data.subject?.code || ''} - ${data.subject?.name || ''}`, c2, y, { width: c3 - c2 - 10 });
                    doc.font('Helvetica-Bold').text('Session', c3, y);
                    doc.font('Helvetica').text(`: ${data.dateSession ? data.dateSession.split('/')[1]?.trim() || '' : ''}`, c4, y);
                    y += 18;

                    doc.font('Helvetica-Bold').text('Semester', c3, y);
                    doc.font('Helvetica').text(`: ${data.semester || ''}`, c4, y);
                    y += 18;

                    const colW = [30, 80, 160, 100, 65, 100];
                    const abSubW = 20;
                    const rowH = 30;
                    doc.rect(M, y, CW, rowH).stroke();
                    doc.font('Helvetica-Bold').fontSize(7.5);
                    let hx = M;

                    doc.text('S.No.', hx, y + 10, { width: colW[0], align: 'center' }); hx += colW[0]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Register Number', hx, y + 10, { width: colW[1], align: 'center' }); hx += colW[1]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Name of the Candidate', hx, y + 10, { width: colW[2], align: 'center' }); hx += colW[2]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();

                    const abX = hx;
                    doc.text('Answer Book No.', abX, y + 4, { width: colW[3], align: 'center' });
                    doc.moveTo(abX, y + 15).lineTo(abX + colW[3], y + 15).stroke();
                    for (let i = 1; i < 5; i++) {
                        doc.moveTo(abX + i * abSubW, y + 15).lineTo(abX + i * abSubW, y + rowH).stroke();
                    }
                    hx += colW[3]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();

                    doc.text('* Write AB for\nAbsent', hx + 2, y + 8, { width: colW[4] - 4, align: 'center' }); hx += colW[4]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Signature of the Candidate', hx + 2, y + 10, { width: colW[5] - 4, align: 'center' });

                    y += rowH;

                    const pageEntries = rows.slice(pageIdx * PAGE_ROWS, (pageIdx + 1) * PAGE_ROWS);
                    pageEntries.forEach((row, ri) => {
                        const dataRowH = 22;
                        doc.rect(M, y, CW, dataRowH).stroke();
                        let rx = M;
                        doc.font('Helvetica-Bold').fontSize(8.5).text(String(pageIdx * PAGE_ROWS + ri + 1), rx + 2, y + 7, { width: colW[0] - 4, align: 'center' }); rx += colW[0]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        doc.text(String(row.registerNumber || ''), rx + 2, y + 7, { width: colW[1] - 4, align: 'center' }); rx += colW[1]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        doc.text(String(row.name || ''), rx + 4, y + 7, { width: colW[2] - 8, align: 'left' }); rx += colW[2]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();

                        const abStartX = rx;
                        for (let i = 1; i <= 5; i++) {
                            doc.moveTo(abStartX + i * abSubW, y).lineTo(abStartX + i * abSubW, y + dataRowH).stroke();
                        }
                        rx += colW[3]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        rx += colW[4]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();

                        y += dataRowH;
                    });
                } else {

                    // Header text
                    const TX = M + LOGO_SZ + 8;
                    const TW = CW - LOGO_SZ - 8;
                    doc.font('Helvetica-Bold').fontSize(13).fillColor('#000').text('M.I.E.T. ENGINEERING COLLEGE', TX, y, { width: TW, align: 'center' });
                    doc.fontSize(10).text('(Autonomous)', TX, y + 16, { width: TW, align: 'center' });
                    doc.font('Helvetica').fontSize(8).text('Affiliated to Anna University, Chennai', TX, y + 28, { width: TW, align: 'center' });
                    doc.font('Helvetica-Bold').fontSize(8).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', TX, y + 42, { width: TW, align: 'center' });
                    doc.font('Helvetica-Bold').fontSize(10).text(`ATTENDANCE FOR SEMESTER EXAMINATIONS ${data.sessionName || ''}`, TX, y + 54, { width: TW, align: 'center' });
                    y += LOGO_SZ + 18;

                    doc.moveTo(M, y).lineTo(M + CW, y).stroke();
                    y += 10;

                    // Info fields - High horizontal gap for long dept names
                    const c1 = M, c2 = M + 110, c3 = M + 350, c4 = M + 440;
                    doc.font('Helvetica-Bold').fontSize(9);
                    doc.text('Degree & Branch', c1, y);
                    doc.font('Helvetica').text(`: ${dept.deptName || data.department || ''}`, c2, y, { width: c3 - c2 - 10 });
                    doc.font('Helvetica-Bold').text('Semester', c3, y);
                    doc.font('Helvetica').text(`: ${data.semester || ''}`, c4, y);
                    y += 18;
                    doc.font('Helvetica-Bold').text('Subject Code', c1, y);
                    doc.font('Helvetica').text(`: ${data.subject?.code || ''}`, c2, y);
                    doc.font('Helvetica-Bold').text('Date of Exam/Session', c3, y);
                    doc.font('Helvetica').text(`: ${data.dateSession || ''}`, c4, y);
                    y += 14;
                    doc.font('Helvetica-Bold').text('Subject Name', c1, y);
                    doc.font('Helvetica').text(`: ${data.subject?.name || ''}`, c2, y, { width: c3 - c2 - 10 });
                    doc.font('Helvetica-Bold').text('Hall Number', c3, y);
                    doc.font('Helvetica').text(`: ${hall.hallName}`, c4, y);
                    y += 18;

                    // Table
                    const colW = [30, 85, 130, 90, 60, 75, 35];
                    const abSubW = 18;
                    const rowH = 30;
                    doc.rect(M, y, CW, rowH).stroke();
                    doc.font('Helvetica-Bold').fontSize(7.5);
                    let hx = M;
                    doc.text('S.No', hx, y + 10, { width: colW[0], align: 'center' }); hx += colW[0]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Register Number', hx, y + 10, { width: colW[1], align: 'center' }); hx += colW[1]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Name of the Candidate', hx, y + 10, { width: colW[2], align: 'center' }); hx += colW[2]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    const abX = hx;
                    doc.text('Answer Booklet No', abX, y + 4, { width: colW[3], align: 'center' });
                    doc.moveTo(abX, y + 15).lineTo(abX + colW[3], y + 15).stroke();
                    for (let i = 1; i < 5; i++) {
                        doc.moveTo(abX + i * abSubW, y + 15).lineTo(abX + i * abSubW, y + rowH).stroke();
                    }
                    hx += colW[3]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('HS To Write\nAB For Absent', hx + 2, y + 8, { width: colW[4] - 4, align: 'center' }); hx += colW[4]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Signature of\nthe Candidate', hx + 2, y + 8, { width: colW[5] - 4, align: 'center' }); hx += colW[5]; doc.moveTo(hx, y).lineTo(hx, y + rowH).stroke();
                    doc.text('Photo', hx, y + 10, { width: colW[6], align: 'center' });
                    y += rowH;

                    const pageEntries = rows.slice(pageIdx * PAGE_ROWS, (pageIdx + 1) * PAGE_ROWS);
                    pageEntries.forEach((row, ri) => {
                        const dataRowH = 22;
                        doc.rect(M, y, CW, dataRowH).stroke();
                        let rx = M;
                        doc.font('Helvetica').fontSize(8).text(String(pageIdx * PAGE_ROWS + ri + 1), rx + 2, y + 7, { width: colW[0] - 4, align: 'center' }); rx += colW[0]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        doc.text(String(row.registerNumber || ''), rx + 2, y + 7, { width: colW[1] - 4, align: 'center' }); rx += colW[1]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        doc.text(String(row.name || ''), rx + 4, y + 7, { width: colW[2] - 8, align: 'left' }); rx += colW[2]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        const abStartX = rx;
                        for (let i = 1; i <= 5; i++) {
                            doc.moveTo(abStartX + i * abSubW, y).lineTo(abStartX + i * abSubW, y + dataRowH).stroke();
                        }
                        rx += colW[3]; rx += colW[4]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        rx += colW[5]; doc.moveTo(rx, y).lineTo(rx, y + dataRowH).stroke();
                        if (row.photo) {
                            const cleanPhoto = row.photo.replace(/^\/uploads\/students\//, '').replace(/^\/uploads\//, '').replace(/^public\//, '').replace(/^students\//, '');
                            const fullPhotoPath = path.join(__dirname, '../../uploads/students', cleanPhoto);
                            if (fs.existsSync(fullPhotoPath)) {
                                doc.image(fullPhotoPath, rx + 4, y + 2, { fit: [colW[6] - 8, dataRowH - 4], align: 'center' });
                            }
                        }
                        rx += colW[6];
                        y += dataRowH;
                    });

                    y += 2;
                    doc.font('Helvetica').fontSize(7.5).text('* Hall SuperIntendent should mark \'AB\' for Absent', M, y, { width: CW, align: 'right' });
                    y += 6;

                    const botY = 675;
                    const certW = CW * 0.70;
                    const certH = 90;
                    doc.rect(M, botY, certW, certH).stroke();
                    doc.font('Helvetica-Bold').fontSize(8).text('Certified that the following particulars have been verified', M + 4, botY + 6);
                    doc.font('Helvetica').fontSize(7.2);
                    doc.text('1.The Register No. in the attendance sheet with that in the hall ticket.', M + 4, botY + 16);
                    doc.text('2.The identification of the candidate with the photo pasted in the hall ticket', M + 4, botY + 28);
                    doc.text('3.The answer book number entered in the attendance sheet by the candidate with the Serial No. on the Answer Book.', M + 4, botY + 36);
                    const signSubY = botY + 70;
                    doc.font('Helvetica').fontSize(8);
                    doc.text('Signature of the Hall SuperIntendent', M + 10, signSubY);
                    doc.text('Signature of the Chief SuperIntendent', M + certW - 150, signSubY);
                    const totLX = M + certW + 20;
                    const totBOX = totLX + 65;
                    doc.font('Helvetica').fontSize(8.2).text('Total Present', totLX, botY + 10);
                    doc.rect(totBOX, botY + 4, 35, 22).stroke();
                    doc.text('Total Absent', totLX, botY + 45);
                    doc.rect(totBOX, botY + 39, 35, 22).stroke();
                }

                doc.font('Helvetica-Bold').fontSize(8.5).text(`Page ${pageIdx + 1} of ${totalPages}`, M, 800 - 40, { width: CW, align: 'right' });
            }
        });
    });

    doc.end();
};

// ─── STUDENT GRADE SHEET (Individual - PRE-PRINTED OVERLAY) ──────────────────
exports.generateOverlayMarksheet = (res, data) => {
    // Standard A4: 595 x 842 pts
    const doc = new PDFDocument({ margin: 0, size: 'A4' }); 
    doc.pipe(res);

    const { student, results, semester, publicationDate, examSession, gpa, cgpa, history, regulation } = data;

    // Helper to format date
    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    };

    doc.font('Helvetica-Bold').fontSize(9);

    // 1. TOP SECTION (Values ONLY)
    // Degree at the very top header
    const degree = student.departmentRef?.degree || 'B.E.';
    doc.text(degree, 245, 132); 
    
    // 2. STUDENT INFORMATION SECTION (Aligns with boxes in IMG3)
    const boxY = 285;
    const col1X = 135; // Name, Reg No, DOB
    const col2X = 325; // Regulations, Gender
    const col3X = 490; // UMIS No, Pub Date, Exam Session
    
    // Row 1
    doc.text(student.name.toUpperCase(), col1X, boxY);
    doc.text(student.umisNumber || '-', col3X + 70, boxY); // UMIS is in middle-right
    
    // Row 2
    doc.text(student.registerNumber || student.rollNo, col1X, boxY + 20);
    doc.text(regulation || '2021 (CBCS)', col2X, boxY + 20);
    doc.text(formatDate(publicationDate), col3X + 110, boxY + 20);
    
    // Row 3
    doc.text(formatDate(student.dateOfBirth), col1X, boxY + 40);
    doc.text((student.gender || 'MALE').toUpperCase(), col2X, boxY + 40);
    doc.text(examSession || '', col3X + 70, boxY + 40);
    
    // Row 4
    const branchName = student.departmentRef?.name || student.department || '';
    doc.text(`${degree} ${branchName.toUpperCase()}`, 200, boxY + 60);

    // PHOTO (Top Right of the student box)
    const photoX = 525;
    const photoY = 288;
    const photoW = 60;
    const photoH = 55;
    
    const photoPath = student.photo ? path.join(__dirname, '../../uploads/students', student.photo) : null;
    if (photoPath && fs.existsSync(photoPath)) {
        try {
            doc.image(photoPath, photoX, photoY, { fit: [photoW, photoH] });
        } catch (e) {
            console.error("Error drawing photo in PDF overlay:", e);
        }
    }

    // 3. MAIN RESULTS TABLE
    let tableY = 392;
    const rowH = 17.5; // Tighter vertical spacing for the main list
    doc.font('Helvetica').fontSize(8.5);

    results.forEach((r) => {
        doc.text(r.semester || semester, 92, tableY); // SEM NO
        doc.text(r.subjectCode, 118, tableY);
        doc.text(r.subjectName, 185, tableY, { width: 230 });
        doc.text(r.credits, 435, tableY, { width: 30, align: 'center' });
        doc.text(r.grade, 485, tableY, { width: 40, align: 'center' });
        doc.text(r.gradePoint, 532, tableY, { width: 40, align: 'center' });
        doc.text(r.result, 575, tableY, { width: 30, align: 'center' });
        tableY += rowH;
    });

    // End of Statement
    doc.font('Helvetica-Bold').fontSize(7.5);
    doc.text('*** End of Statement ***', 0, 665, { width: 595, align: 'center' });

    // 4. BOTTOM SEMESTER SUMMARY MATRIX (I - VIII)
    // Horizontal positions aligned under Roman Columns I to VIII
    const romanX = [225, 272, 319, 366, 413, 460, 507, 554]; 
    const matrixStart = 705;
    
    doc.fontSize(8);
    history.forEach(res => {
        const semIdx = res.semester - 1;
        if (semIdx >= 0 && semIdx < 8) {
            const x = romanX[semIdx];
            doc.text(res.totalCredits || '-', x, matrixStart, { width: 40, align: 'center' });
            doc.text(res.earnedCredits || '-', x, matrixStart + 17, { width: 40, align: 'center' });
            const gp = (res.gpa * res.totalCredits).toFixed(0);
            doc.text(gp === 'NaN' ? '-' : gp, x, matrixStart + 34, { width: 40, align: 'center' });
            doc.text(res.gpa.toFixed(3), x, matrixStart + 51, { width: 40, align: 'center' });
        }
    });

    // 5. FINAL TOTALS
    const totalEarned = history.reduce((acc, r) => acc + (r.earnedCredits || 0), 0);
    doc.fontSize(9.5).text(totalEarned, 215, 772);
    doc.text(cgpa, 440, 772);
    doc.text('ENGLISH', 545, 772);

    // Bottom Date & Place
    doc.fontSize(9).text(formatDate(new Date()), 75, 845);

    doc.end();
};

// ─── STUDENT ID CARD ──────────────────────────────────────────────────────────
exports.generateStudentIDCard = (res, data) => {
    // Standard credit card size is roughly 3.375 x 2.125 inches
    // We'll use 243 x 153 points
    const doc = new PDFDocument({ size: [243, 153], margin: 10 });
    doc.pipe(res);

    const W = 243;
    const H = 153;
    const M = 10;

    // Background
    doc.rect(0, 0, W, H).fill('#ffffff');
    doc.rect(0, 0, W, 35).fill('#003B73');

    // Header
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    doc.text('M.I.E.T. ENGINEERING COLLEGE', 0, 8, { width: W, align: 'center' });
    doc.fontSize(6).font('Helvetica').text('(Autonomous) Trichy - 620 007', 0, 18, { width: W, align: 'center' });

    // Photo
    const photoSize = 45;
    const photoX = M;
    const photoY = 45;
    doc.rect(photoX, photoY, photoSize, photoSize + 10).stroke('#cccccc');

    const photoPath = data.student.photo ? path.join(__dirname, '../../uploads/students', data.student.photo) : null;
    if (photoPath && fs.existsSync(photoPath)) {
        doc.image(photoPath, photoX + 2, photoY + 2, { fit: [photoSize - 4, photoSize + 6] });
    } else {
        doc.fillColor('#999999').fontSize(6).text('PHOTO', photoX, photoY + 25, { width: photoSize, align: 'center' });
    }

    // Student Details
    const dx = photoX + photoSize + 10;
    let dy = 45;
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
    doc.text(data.student.name.toUpperCase(), dx, dy, { width: W - dx - M });
    dy += 14;

    doc.fontSize(8).font('Helvetica');
    doc.text(`Reg No: ${data.student.registerNumber || data.student.rollNo}`, dx, dy);
    dy += 12;
    doc.text(`Dept: ${data.student.department}`, dx, dy);
    dy += 12;
    doc.text(`Batch: ${data.student.batch || '-'}`, dx, dy);
    dy += 12;
    doc.text(`Blood: ${data.student.bloodGroup || '-'}`, dx, dy);

    // Footer
    doc.rect(0, H - 20, W, 20).fill('#003B73');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
    doc.text('STUDENT IDENTITY CARD', 0, H - 14, { width: W, align: 'center' });

    doc.end();
};
