const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const COLLEGE_NAME = 'M.I.E.T. Engineering College';
const COLLEGE_NAME_BOLD = '(AUTONOMOUS)';
const COLLEGE_SUB = '(Affiliated to Anna University, Chennai)';
const COLLEGE_CITY = 'TIRUCHIRAPPALLI';
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
    const M = 40;
    const CW = 515;

    if (fs.existsSync(MIET_LOGO)) {
        doc.image(MIET_LOGO, M, startY, { width: LOGO_SZ, height: LOGO_SZ });
    }

    const TX = M + LOGO_SZ + 10;
    const TW = CW - LOGO_SZ - 10;

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000');
    doc.text(COLLEGE_NAME, TX, startY + 2, { width: TW, align: 'center' });
    doc.fontSize(12).text(COLLEGE_NAME_BOLD, TX, startY + 20, { width: TW, align: 'center' });
    doc.fontSize(9).font('Helvetica').text(COLLEGE_SUB, TX, startY + 35, { width: TW, align: 'center' });
    doc.text(COLLEGE_CITY, TX, startY + 45, { width: TW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(10).text(CONTROLLER_LINE, TX, startY + 58, { width: TW, align: 'center' });

    return startY + LOGO_SZ + 15;
}

// ─── THEORY: Statement of Marks PDF ──────────────────────────────────────────
exports.generateTheoryStatementOfMarks = (res, data) => {
    const entries = data.entries || [];
    const PAGE_STUDENTS = 25;
    const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_STUDENTS));
    const pages = [];
    for (let i = 0; i < entries.length; i += PAGE_STUDENTS) {
        pages.push(entries.slice(i, i + PAGE_STUDENTS));
    }
    if (pages.length === 0) pages.push([]);

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    const M = 40;
    const CW = 515;

    pages.forEach((pageRows, pageIdx) => {
        if (pageIdx > 0) doc.addPage();

        let y = 25;
        y = drawMIETHeader(doc, y);

        const year = new Date().getFullYear();
        const componentLabel = data.component === 'LAB' ? 'PRACTICAL' : 'THEORY';
        const examTitle = data.examTitle || `END SEMESTER ${componentLabel} EXAMINATIONS NOV/DEC ${year}`;

        doc.font('Helvetica-Bold').fontSize(11).text(examTitle, M, y, { width: CW, align: 'center' });
        y += 15;

        if (data.boardName) {
            doc.fontSize(10).text(data.boardName, M, y, { width: CW, align: 'center' });
            y += 15;
        }

        doc.fontSize(12).text('STATEMENT OF MARKS', M, y, { width: CW, align: 'center', underline: true });
        y += 20;

        // Info Table
        const col1 = M, col2 = M + 90, col3 = M + 280, col4 = M + 380;
        doc.font('Helvetica-Bold').fontSize(9);

        doc.text('COURSE CODE:', col1, y);
        doc.font('Helvetica').text(data.subject?.code || '', col2, y);
        doc.font('Helvetica-Bold').text('SEMESTER:', col3, y);
        doc.font('Helvetica').text(romanize(data.subject?.semester) || '', col4, y);
        y += 15;

        doc.font('Helvetica-Bold').text('COURSE TITLE:', col1, y);
        doc.font('Helvetica').text(data.subject?.name || '', col2, y, { width: 180 });
        doc.font('Helvetica-Bold').text('QP CODE:', col3, y);
        doc.font('Helvetica').text(data.qpCode || 'N/A', col4, y);
        y += 20;

        doc.font('Helvetica-Bold').text('DATE:', col1, y);
        doc.font('Helvetica').text(data.dateSession || '', col2, y);
        doc.font('Helvetica-Bold').text('DEGREE:', col3, y);
        doc.font('Helvetica').text(data.subject?.departmentRef?.degree || 'B.E.', col4, y);
        y += 15;

        doc.font('Helvetica-Bold').text('PACKET NO:', col1, y);
        const packetBase = parseInt(data.packetNoBase) || 1;
        doc.font('Helvetica').text(`${packetBase + pageIdx}/${totalPages}`, col2, y);
        y += 20;

        // Main Table
        const TW = CW;
        const c1 = 40, c2 = 120, c3 = 100, c4 = 255;
        const rowH = 20;

        // Headers
        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(M, y, TW, rowH).fillAndStroke('#f0f0f0', '#000000');
        doc.fillColor('#000000');
        doc.text('S.NO', M + 2, y + 6, { width: c1, align: 'center' });
        doc.text('DUMMY NUMBER', M + c1, y + 6, { width: c2, align: 'center' });
        doc.text('MARKS (FIG)', M + c1 + c2, y + 6, { width: c3, align: 'center' });
        doc.text('MARKS IN WORDS', M + c1 + c2 + c3, y + 6, { width: c4, align: 'center' });

        // Vertical dividers for header
        [c1, c1 + c2, c1 + c2 + c3].forEach(x => {
            doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
        });
        y += rowH;

        doc.font('Helvetica').fontSize(9);
        const startSNo = pageIdx * PAGE_STUDENTS + 1;

        for (let i = 0; i < PAGE_STUDENTS; i++) {
            const row = pageRows[i];
            doc.rect(M, y, TW, rowH).stroke();
            [c1, c1 + c2, c1 + c2 + c3].forEach(x => {
                doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
            });

            doc.text(`${startSNo + i}`, M, y + 6, { width: c1, align: 'center' });
            if (row) {
                doc.text(row.dummyNumber || '', M + c1, y + 6, { width: c2, align: 'center' });
                if (row.marks != null) {
                    doc.font('Helvetica-Bold').text(row.marks.toString(), M + c1 + c2, y + 6, { width: c3, align: 'center' });
                    doc.font('Helvetica').text(numberToWords(row.marks), M + c1 + c2 + c3 + 5, y + 6, { width: c4 - 10, align: 'left' });
                }
            }
            y += rowH;
        }

        // Summary Line
        doc.rect(M, y, TW, rowH).stroke();
        doc.font('Helvetica-Bold').text('TOTAL CANDIDATES PRESENT:', M + 10, y + 6);
        doc.text(pageRows.filter(r => r.marks != null).length.toString(), M + 180, y + 6);
        y += 40;

        // Signatures
        const sigY = 780;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('ASSISTANT EXAMINER', M, sigY);
        doc.text('EXAMINER', M, sigY, { width: CW, align: 'center' });
        doc.text('BOARD CHAIRMAN', M, sigY, { width: CW, align: 'right' });
    });

    doc.end();
};

// ─── LAB: Statement of Marks PDF ─────────────────────────────────────────────
exports.generateLabStatementOfMarks = (res, data) => {
    const entries = data.entries || [];
    const PAGE_STUDENTS = 25;
    const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_STUDENTS));
    const pages = [];
    for (let i = 0; i < entries.length; i += PAGE_STUDENTS) {
        pages.push(entries.slice(i, i + PAGE_STUDENTS));
    }
    if (pages.length === 0) pages.push([]);

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    doc.pipe(res);

    const M = 40, CW = 515;

    pages.forEach((pageRows, pageIdx) => {
        if (pageIdx > 0) doc.addPage();
        let y = 25;
        y = drawMIETHeader(doc, y);

        const year = new Date().getFullYear();
        doc.font('Helvetica-Bold').fontSize(11).text(`END SEMESTER PRACTICAL EXAMINATIONS NOV/DEC ${year}`, M, y, { width: CW, align: 'center' });
        y += 20;

        doc.fontSize(12).text('STATEMENT OF MARKS', M, y, { width: CW, align: 'center', underline: true });
        y += 20;

        // Info
        const c1 = M, c2 = M + 100, c3 = M + 280, c4 = M + 380;
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('COURSE CODE:', c1, y);
        doc.font('Helvetica').text(data.subject?.code || '', c2, y);
        doc.font('Helvetica-Bold').text('SEMESTER:', c3, y);
        doc.font('Helvetica').text(romanize(data.subject?.semester) || '', c4, y);
        y += 18;

        doc.font('Helvetica-Bold').text('COURSE TITLE:', c1, y);
        doc.font('Helvetica').text(data.subject?.name || '', c2, y, { width: 170 });
        doc.font('Helvetica-Bold').text('DEGREE:', c3, y);
        doc.font('Helvetica').text(data.subject?.departmentRef?.degree || 'B.E.', c4, y);
        y += 18;

        doc.font('Helvetica-Bold').text('DATE:', c1, y);
        doc.font('Helvetica').text(data.dateSession || '', c2, y);
        y += 25;

        // Table
        const TW = CW;
        const col_sno = 50, col_reg = 180, col_mark = 140, col_rem = 145;
        const rowH = 20;

        doc.font('Helvetica-Bold').fontSize(9);
        doc.rect(M, y, TW, rowH).fillAndStroke('#f0f0f0', '#000000');
        doc.fillColor('#000000');
        doc.text('S.NO', M, y + 6, { width: col_sno, align: 'center' });
        doc.text('REGISTER NUMBER', M + col_sno, y + 6, { width: col_reg, align: 'center' });
        doc.text('MARKS', M + col_sno + col_reg, y + 6, { width: col_mark, align: 'center' });
        doc.text('REMARKS', M + col_sno + col_reg + col_mark, y + 6, { width: col_rem, align: 'center' });

        [col_sno, col_sno + col_reg, col_sno + col_reg + col_mark].forEach(x => {
            doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
        });
        y += rowH;

        doc.font('Helvetica').fontSize(10);
        for (let i = 0; i < PAGE_STUDENTS; i++) {
            const row = pageRows[i];
            doc.rect(M, y, TW, rowH).stroke();
            [col_sno, col_sno + col_reg, col_sno + col_reg + col_mark].forEach(x => {
                doc.moveTo(M + x, y).lineTo(M + x, y + rowH).stroke();
            });

            doc.text(`${(pageIdx * PAGE_STUDENTS) + i + 1}`, M, y + 6, { width: col_sno, align: 'center' });
            if (row) {
                doc.font('Helvetica-Bold').text(row.registerNumber || '', M + col_sno, y + 6, { width: col_reg, align: 'center' });
                if (row.marks != null) {
                    doc.text(row.marks.toString(), M + col_sno + col_reg, y + 6, { width: col_mark, align: 'center' });
                }
            }
            y += rowH;
        }

        y += 50;
        const sigY = 780;
        doc.font('Helvetica-Bold').text('INTERNAL EXAMINER', M, sigY);
        doc.text('EXTERNAL EXAMINER', M, sigY, { width: CW, align: 'right' });
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
    doc.text(`BRANCH: ${data.department}`, M, y);
    doc.text(`SEMESTER: ${data.semester}`, M + 400, y);
    y += 15;
    doc.text(`REGULATION: ${data.regulation || '2021'}`, M, y);
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
    // A3 Landscape T-Sheet Redesign
    const doc = new PDFDocument({ margin: 20, size: 'A3', layout: 'landscape' });
    doc.pipe(res);

    const M = 30;
    const CW = doc.page.width - 2 * M;
    let y = 30;

    // --- Header Section (Matching img2) ---
    doc.font('Helvetica-Bold').fontSize(14).text('M.I.E.T. ENGINEERING COLLEGE (AUTONOMOUS),TRICHY-620007', M, y, { width: CW, align: 'center' });
    y += 18;
    doc.fontSize(12).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', M, y, { width: CW, align: 'center' });
    y += 18;

    const examSession = data.examSession || 'NOVEMBER/DECEMBER EXAMINATIONS 2025';
    doc.fontSize(12).text(`PROVISIONAL RESULTS OF ${examSession.toUpperCase()}`, M, y, { width: CW, align: 'center' });
    y += 25;

    // --- Branch/Semester Info Line ---
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(`B.E. ${data.department || ''}`, M, y);
    doc.text(`Semester : ${data.semester || ''}`, M + 450, y);
    doc.text(`R-${data.regulation || '2021'}`, M + 600, y);
    const pubDate = data.publicationDate || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    doc.text(`Date of Publication : ${pubDate}`, M + 750, y);
    y += 15;

    const subjects = data.subjects || [];
    const subCount = subjects.length;

    // Layout configuration
    const colWidths = {
        sno: 25,
        regno: 70,
        name: 0 // Will adjust based on remaining space
    };

    // Each subject gets a block with Int, P-Ext, T-Ext, Total, A-Grade, R-Grade
    // We need to calculate how much space we have for subjects
    const fixedWidthStart = colWidths.sno + colWidths.regno;
    const statCols = { gpa: 30, cgpa: 30, cr: 25, result: 40 };
    const fixedWidthEnd = statCols.gpa + statCols.cgpa + statCols.cr + statCols.result;

    const totalAvail = CW - fixedWidthStart - fixedWidthEnd;
    // Subject block needs space for 6 tiny columns: Int, P-Ext, T-Ext, Total, Actual Grade, Relative Grade
    const subBlockWidth = subCount > 0 ? Math.floor(totalAvail / subCount) : 0;

    // Tiny sub-column relative widths
    const subParts = { int: 0.12, pext: 0.15, text: 0.15, total: 0.18, agrade: 0.20, rgrade: 0.20 };

    const drawLineLocal = (x1, y1, x2, y2) => drawLine(doc, x1, y1, x2, y2);

    const drawEnhancedRow = (row, isHeader = false) => {
        const rowH = isHeader ? 60 : 32;
        if (y + rowH > doc.page.height - 40) {
            doc.addPage();
            y = 30; // reset y on new page
        }

        doc.rect(M, y, CW, rowH).stroke();
        doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(isHeader ? 9 : 9);

        let curX = M;
        // S.No
        doc.text(row.sno || '', curX, y + (rowH / 2) - 4, { width: colWidths.sno, align: 'center' }); curX += colWidths.sno; drawLineLocal(curX, y, curX, y + rowH);
        // Register No
        doc.text(row.regno || '', curX, y + (rowH / 2) - 4, { width: colWidths.regno, align: 'center' }); curX += colWidths.regno; drawLineLocal(curX, y, curX, y + rowH);

        // Subjects
        subjects.forEach(sub => {
            const bx = curX;
            const bw = subBlockWidth;
            const isIntegrated = sub.subjectCategory === 'INTEGRATED';

            if (isHeader) {
                // Subject Code Header
                doc.fontSize(9).text(sub.code, bx, y + 6, { width: bw, align: 'center' });
                drawLineLocal(bx, y + 18, bx + bw, y + 18);

                const subY = y + 18;
                let sx = bx;
                doc.fontSize(6);

                // Sub-headers: Int, P-Ext, T-Ext, Total
                doc.text('Int', sx, subY + 14, { width: bw * subParts.int, align: 'center' }); sx += bw * subParts.int; drawLineLocal(sx, subY, sx, y + rowH);
                doc.text('P-E', sx, subY + 14, { width: bw * subParts.pext, align: 'center' }); sx += bw * subParts.pext; drawLineLocal(sx, subY, sx, y + rowH);
                doc.text('T-E', sx, subY + 14, { width: bw * subParts.text, align: 'center' }); sx += bw * subParts.text; drawLineLocal(sx, subY, sx, y + rowH);
                doc.text('Tot', sx, subY + 14, { width: bw * subParts.total, align: 'center' }); sx += bw * subParts.total; drawLineLocal(sx, subY, sx, y + rowH);

                doc.fontSize(6);
                doc.text('A-G', sx, subY + 14, { width: bw * subParts.agrade, align: 'center' }); sx += bw * subParts.agrade; drawLineLocal(sx, subY, sx, y + rowH);
                doc.text('R-G', sx, subY + 14, { width: bw * subParts.rgrade, align: 'center' });

                // Max marks line
                doc.fontSize(5.5).fillColor('#444');
                let mx = bx;
                const intMax = isIntegrated ? '50' : (sub.subjectCategory === 'LAB' ? '60' : '40');
                const extMax = isIntegrated ? '50' : (sub.subjectCategory === 'LAB' ? '40' : '60');

                doc.text(intMax, mx, subY + 3, { width: bw * subParts.int, align: 'center' }); mx += bw * subParts.int;
                doc.text(sub.subjectCategory === 'LAB' || isIntegrated ? extMax : '', mx, subY + 3, { width: bw * subParts.pext, align: 'center' }); mx += bw * subParts.pext;
                doc.text(sub.subjectCategory === 'THEORY' || isIntegrated ? extMax : '', mx, subY + 3, { width: bw * subParts.text, align: 'center' }); mx += bw * subParts.text;
                doc.text('100', mx, subY + 3, { width: bw * subParts.total, align: 'center' });
                doc.fillColor('#000');
            } else {
                const mark = row.marks[sub.code] || {};
                let sx = bx;
                doc.fontSize(8);

                // Int
                doc.text(mark.internal != null ? Math.round(mark.internal).toString() : '-', sx, y + 10, { width: bw * subParts.int, align: 'center' }); sx += bw * subParts.int; drawLineLocal(sx, y, sx, y + rowH);

                // P-Ext
                doc.text(mark.labExt != null ? Math.round(mark.labExt).toString() : '-', sx, y + 10, { width: bw * subParts.pext, align: 'center' }); sx += bw * subParts.pext; drawLineLocal(sx, y, sx, y + rowH);

                // T-Ext
                doc.text(mark.theoryExt != null ? Math.round(mark.theoryExt).toString() : '-', sx, y + 10, { width: bw * subParts.text, align: 'center' }); sx += bw * subParts.text; drawLineLocal(sx, y, sx, y + rowH);

                // Total
                doc.font('Helvetica-Bold').text(mark.total != null ? Math.round(mark.total).toString() : '-', sx, y + 10, { width: bw * subParts.total, align: 'center' }); sx += bw * subParts.total; drawLineLocal(sx, y, sx, y + rowH);

                // Grades (A and R)
                doc.font('Helvetica').fontSize(mark.grade?.length > 2 ? 6 : 8);
                doc.text(mark.grade || '-', sx, y + 10, { width: bw * subParts.agrade, align: 'center' }); sx += bw * subParts.agrade; drawLineLocal(sx, y, sx, y + rowH);
                doc.text(mark.grade || '-', sx, y + 10, { width: bw * subParts.rgrade, align: 'center' });
                doc.font('Helvetica');
            }
            curX += bw; drawLineLocal(curX, y, curX, y + rowH);
        });

        // Stats at the end
        doc.fontSize(8.5);
        doc.text(row.gpa || '0.00', curX, y + 10, { width: statCols.gpa, align: 'center' }); curX += statCols.gpa; drawLineLocal(curX, y, curX, y + rowH);
        doc.text(row.cgpa || '0.00', curX, y + 10, { width: statCols.cgpa, align: 'center' }); curX += statCols.cgpa; drawLineLocal(curX, y, curX, y + rowH);
        doc.text(row.cr || '0', curX, y + 10, { width: statCols.cr, align: 'center' }); curX += statCols.cr; drawLineLocal(curX, y, curX, y + rowH);

        let status = row.result;
        if (status === 'PASS') doc.fillColor('#006400');
        else if (status === 'FAIL') doc.fillColor('#8B0000');
        else doc.fillColor('#444444');

        doc.text(status || 'PENDING', curX, y + 10, { width: statCols.result, align: 'center' });
        doc.fillColor('#000000');

        y += rowH;
    };

    // Draw Header
    drawEnhancedRow({
        sno: 'S.No.',
        regno: 'Register No.',
        gpa: 'GPA',
        cgpa: 'CGPA',
        cr: 'CR',
        result: 'RESULT'
    }, true);

    // Draw Data
    data.students.forEach((s, idx) => {
        let displayStatus = 'PENDING';
        if (s.resultStatus === 'PASS') displayStatus = 'PASS';
        else if (s.resultStatus === 'FAIL') displayStatus = 'FAIL';

        drawEnhancedRow({
            sno: (idx + 1).toString(),
            regno: s.registerNumber,
            marks: s.marks,
            gpa: s.gpa?.toFixed(2),
            cgpa: s.cgpa?.toFixed(2),
            cr: s.earnedCredits?.toString(),
            result: displayStatus
        });
    });

    const sigY = doc.page.height - 50;
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Prepared By', M + 50, sigY);
    doc.text('Verified By', M + 450, sigY);
    doc.text('Controller of Examinations', CW - 100, sigY);

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
        doc.fontSize(8).font('Helvetica').text('Note: If any discrepancies are found in the Hall Ticket, report to the COE office immediately.', M + 14, sigY + 24);
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
                    doc.image(logoPath, M, y, { width: LOGO_SZ });
                }

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
                doc.font('Helvetica-Bold').fontSize(8.5).text(`Page ${pageIdx + 1} of ${totalPages}`, M, 800-40, { width: CW, align: 'right' });
            }
        });
    });

    doc.end();
};
