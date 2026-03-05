const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const COLLEGE_NAME = 'M.I.E.T. Engineering College';
const COLLEGE_NAME_BOLD = '(AUTONOMOUS)';
const COLLEGE_SUB = '(Affiliated to Anna University, Chennai)';
const COLLEGE_CITY = 'TIRUCHIRAPPALLI';
const CONTROLLER_LINE = 'OFFICE OF THE CONTROLLER OF EXAMINATIONS';
const MIET_LOGO = path.join(__dirname, '../../client/public/miet-logo.png');

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
        doc.font('Helvetica-Bold').text('PACKET NO:', col3, y);
        const packetBase = parseInt(data.packetNoBase) || 1;
        doc.font('Helvetica').text(`${packetBase + pageIdx}/${totalPages}`, col4, y);
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
        doc.font('Helvetica-Bold').text('DATE:', c3, y);
        doc.font('Helvetica').text(data.dateSession || '', c4, y);
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

exports.generateGradeSheet = (res, data) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('COLLEGE ERP - SEMESTER GRADE SHEET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${data.studentName}`);
    doc.text(`Register Number: ${data.registerNumber}`);
    doc.text(`Department: ${data.department}`);
    doc.text(`Semester: ${data.semester}`);
    doc.moveDown();
    const tableTop = 200;
    doc.fontSize(10);
    doc.text('Subject Code', 50, tableTop);
    doc.text('Subject Name', 150, tableTop);
    doc.text('Credits', 350, tableTop);
    doc.text('Grade', 400, tableTop);
    doc.text('Status', 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    let y = tableTop + 25;
    data.marks.forEach(m => {
        doc.text(m.subjectCode, 50, y);
        doc.text(m.subjectName, 150, y);
        doc.text(m.credits.toString(), 350, y);
        doc.text(m.grade || 'N/A', 400, y);
        doc.text(m.status, 450, y);
        y += 20;
    });
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;
    doc.fontSize(12).text(`GPA: ${data.gpa.toFixed(2)}`, 50, y);
    doc.text(`Result: ${data.resultStatus}`, 150, y);
    doc.end();
};

exports.generateTranscript = (res, data) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('OFFICIAL TRANSCRIPT', { align: 'center' });
    doc.end();
};
