const PDFDocument = require('pdfkit');

const COLLEGE_NAME = 'M.I.E.T. ENGINEERING COLLEGE (AUTONOMOUS)';
const COLLEGE_SUB = '(Affiliated to Anna University, Chennai)';
const COLLEGE_CITY = 'TIRUCHIRAPPALLI';
const CONTROLLER_LINE = 'OFFICE OF THE CONTROLLER OF EXAMINATIONS';

exports.generateGradeSheet = (res, data) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('COLLEGE ERP - SEMESTER GRADE SHEET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${data.studentName}`);
    doc.text(`Register Number: ${data.registerNumber}`);
    doc.text(`Department: ${data.department}`);
    doc.text(`Semester: ${data.semester}`);
    doc.text(`Batch: ${data.batch || 'N/A'}`);
    doc.text(`Regulation: ${data.regulation || '2021'}`);
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

// ─── Helper: Draw college header ──────────────────────────────────────────────
function drawHeader(doc, titleLine1, titleLine2) {
    const startY = 40;
    doc.fontSize(13).font('Helvetica-Bold').text(COLLEGE_NAME, 50, startY, { align: 'center', width: 495 });
    doc.fontSize(9).font('Helvetica').text(COLLEGE_SUB, { align: 'center', width: 495 });
    doc.fontSize(9).text(COLLEGE_CITY, { align: 'center', width: 495 });
    doc.fontSize(9).text(CONTROLLER_LINE, { align: 'center', width: 495 });
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').text(titleLine1, { align: 'center', width: 495 });
    if (titleLine2) doc.fontSize(10).font('Helvetica-Bold').text(titleLine2, { align: 'center', width: 495 });
    doc.moveDown(0.5);
    return doc.y;
}

// ─── Helper: Draw a table page ───────────────────────────────────────────────
const PAGE_STUDENTS = 25;
const COL1 = 50, COL2 = 90, COL3 = 230, COL4 = 370, ROW_H = 19;

function drawTheoryTable(doc, rows, pageIndex, totalPages, startSNo) {
    const tableTop = doc.y;
    // Header row
    doc.rect(COL1, tableTop, 495, ROW_H).stroke();
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('S.NO.', COL1 + 2, tableTop + 5, { width: 35, align: 'center' });
    doc.text('DUMMY NUMBER', COL2 + 2, tableTop + 5, { width: 135, align: 'center' });
    doc.text('MARKS IN FIGURE', COL3 + 2, tableTop + 5, { width: 135, align: 'center' });
    doc.text('MARKS IN WORDS', COL4 + 2, tableTop + 5, { width: 130, align: 'center' });
    let y = tableTop + ROW_H;
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, i) => {
        doc.rect(COL1, y, 495, ROW_H).stroke();
        doc.text((startSNo + i).toString() + '.', COL1 + 2, y + 4, { width: 35, align: 'center' });
        doc.text(row.dummyNumber || '', COL2 + 2, y + 4, { width: 135, align: 'center' });
        doc.text(row.marks != null ? row.marks.toString() : '', COL3 + 2, y + 4, { width: 135, align: 'center' });
        doc.text(row.marksInWords || '', COL4 + 2, y + 4, { width: 130, align: 'center' });
        y += ROW_H;
    });
    // Total row
    doc.rect(COL1, y, 495, ROW_H).stroke();
    doc.font('Helvetica-Bold').text('TOTAL MARKS', COL1 + 2, y + 4, { width: 175, align: 'left' });
    doc.font('Helvetica').text('', COL3 + 2, y + 4, { width: 135, align: 'center' });
    y += ROW_H + 10;
    doc.text(`Page ${pageIndex + 1} of ${totalPages}`, COL1, y, { fontSize: 7, align: 'right', width: 495 });
    return y;
}

function drawLabTable(doc, rows, pageIndex, totalPages, startSNo) {
    const tableTop = doc.y;
    doc.rect(COL1, tableTop, 495, ROW_H).stroke();
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('S.NO.', COL1 + 2, tableTop + 5, { width: 40, align: 'center' });
    doc.text('REGISTER NUMBER', COL2 + 2, tableTop + 5, { width: 175, align: 'center' });
    doc.text('MARKS', COL3 + 2, tableTop + 5, { width: 100, align: 'center' });
    doc.text('REMARKS', COL4 + 2, tableTop + 5, { width: 130, align: 'center' });
    let y = tableTop + ROW_H;
    doc.font('Helvetica').fontSize(8);
    rows.forEach((row, i) => {
        doc.rect(COL1, y, 495, ROW_H).stroke();
        doc.text((startSNo + i).toString(), COL1 + 2, y + 4, { width: 40, align: 'center' });
        doc.text(row.registerNumber || '', COL2 + 2, y + 4, { width: 175, align: 'center' });
        doc.text(row.marks != null ? row.marks.toString() : '', COL3 + 2, y + 4, { width: 100, align: 'center' });
        doc.text('', COL4 + 2, y + 4, { width: 130 });
        y += ROW_H;
    });
    doc.text(`Page ${pageIndex + 1} of ${totalPages}`, COL1, y + 5, { fontSize: 7, align: 'right', width: 495 });
    return y + 20;
}

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

// ─── THEORY: Statement of Marks PDF ──────────────────────────────────────────
exports.generateTheoryStatementOfMarks = (res, data) => {
    // data: { subject, examSession, entries: [{dummyNumber, marks}], department, packetNo, qpCode, dateSession }
    const entries = data.entries || [];
    const pages = [];
    for (let i = 0; i < entries.length; i += PAGE_STUDENTS) {
        pages.push(entries.slice(i, i + PAGE_STUDENTS));
    }
    if (pages.length === 0) pages.push([]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    pages.forEach((pageRows, pageIdx) => {
        if (pageIdx > 0) doc.addPage();

        // Header
        doc.fontSize(13).font('Helvetica-Bold').text(COLLEGE_NAME, 50, 40, { align: 'center', width: 495 });
        doc.fontSize(8).font('Helvetica').text(COLLEGE_SUB, { align: 'center', width: 495 });
        doc.fontSize(8).text(CONTROLLER_LINE, { align: 'center', width: 495 });
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text(`M.B.A. END SEMESTER THEORY EXAMINATIONS NOV/DEC ${new Date().getFullYear()}`, { align: 'center', width: 495 });
        doc.fontSize(9).text(data.boardName || '', { align: 'center', width: 495 });
        doc.fontSize(11).font('Helvetica-Bold').text('STATEMENT OF MARKS', { align: 'center', width: 495 });
        doc.moveDown(0.5);

        // Info grid
        const infoY = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('COURSE CODE', 50, infoY);
        doc.font('Helvetica').text(data.subject?.code || '', 130, infoY);
        doc.font('Helvetica-Bold').text('QUESTION PAPER CODE', 310, infoY);
        doc.font('Helvetica').text(data.qpCode || '', 430, infoY);

        doc.font('Helvetica-Bold').text('COURSE TITLE', 50, infoY + 14);
        doc.font('Helvetica').text(data.subject?.name || '', 130, infoY + 14, { width: 170 });
        doc.font('Helvetica-Bold').text('PACKET NO', 310, infoY + 14);
        doc.font('Helvetica').text(data.packetNo || '', 430, infoY + 14);

        doc.font('Helvetica-Bold').text('SEMESTER', 50, infoY + 28);
        doc.font('Helvetica').text(romanize(data.subject?.semester) || '', 130, infoY + 28);
        doc.font('Helvetica-Bold').text('DATE & SESSION', 310, infoY + 28);
        doc.font('Helvetica').text(data.dateSession || '', 430, infoY + 28);

        doc.moveDown(0.5);
        doc.y = infoY + 46;

        // Table
        const startSNo = pageIdx * PAGE_STUDENTS + 1;
        const rowsWithWords = pageRows.map(row => ({
            ...row,
            marksInWords: numberToWords(row.marks)
        }));
        const tableEnd = drawTheoryTable(doc, rowsWithWords, pageIdx, pages.length, startSNo);

        // Signatures
        const sigY = tableEnd + 30;
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('ASSISTANT EXAMINER', 50, sigY);
        doc.text('EXAMINER', 220, sigY, { align: 'center', width: 160 });
        doc.text('BOARD CHAIRMAN', 430, sigY);
        doc.fontSize(7).font('Helvetica');
        doc.text('(Name, Designation &Institution)', 195, sigY + 12);
    });

    doc.end();
};

// ─── LAB: Statement of Marks PDF ─────────────────────────────────────────────
exports.generateLabStatementOfMarks = (res, data) => {
    // data: { subject, department, entries: [{registerNumber, marks}], dateSession }
    const allEntries = data.entries || [];

    // Group by department for multi-dept subjects
    const deptGroups = {};
    allEntries.forEach(e => {
        const dept = e.department || data.department || 'General';
        if (!deptGroups[dept]) deptGroups[dept] = [];
        deptGroups[dept].push(e);
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    let firstPage = true;
    Object.entries(deptGroups).forEach(([dept, entries]) => {
        const pages = [];
        for (let i = 0; i < entries.length; i += PAGE_STUDENTS) {
            pages.push(entries.slice(i, i + PAGE_STUDENTS));
        }
        if (pages.length === 0) pages.push([]);

        pages.forEach((pageRows, pageIdx) => {
            if (!firstPage) doc.addPage();
            firstPage = false;

            doc.fontSize(13).font('Helvetica-Bold').text(COLLEGE_NAME, 50, 40, { align: 'center', width: 495 });
            doc.fontSize(8).font('Helvetica').text(COLLEGE_SUB, { align: 'center', width: 495 });
            doc.fontSize(8).text(CONTROLLER_LINE, { align: 'center', width: 495 });
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica-Bold').text(`B.E./B.Tech. END SEMESTER PRACTICAL EXAMINATIONS NOV/DEC ${new Date().getFullYear()}`, { align: 'center', width: 495 });
            doc.fontSize(9).font('Helvetica-Bold').text(dept, { align: 'center', width: 495 });
            doc.fontSize(11).font('Helvetica-Bold').text('Statement of Marks', { align: 'center', width: 495 });
            doc.moveDown(0.4);

            const infoY = doc.y;
            doc.fontSize(8).font('Helvetica-Bold').text('COURSE CODE:', 50, infoY);
            doc.font('Helvetica').text(data.subject?.code || '', 130, infoY);
            doc.font('Helvetica-Bold').text('DATE & SESSION:', 310, infoY);
            doc.font('Helvetica').text(data.dateSession || '', 400, infoY);
            doc.font('Helvetica-Bold').text('COURSE TITLE:', 50, infoY + 14);
            doc.font('Helvetica').text(data.subject?.name || '', 130, infoY + 14, { width: 170 });
            doc.font('Helvetica-Bold').text('SEMESTER:', 310, infoY + 14);
            doc.font('Helvetica').text(romanize(data.subject?.semester) || '', 400, infoY + 14);
            doc.y = infoY + 32;
            doc.moveDown(0.3);

            const startSNo = pageIdx * PAGE_STUDENTS + 1;
            const tableEnd = drawLabTable(doc, pageRows, pageIdx, pages.length, startSNo);

            const sigY = tableEnd + 25;
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Internal Examiner', 50, sigY);
            doc.text('External Examiner', 380, sigY);
        });
    });

    doc.end();
};

function romanize(num) {
    const val = [['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
    let result = '';
    let n = parseInt(num) || 0;
    for (const [r, v] of val) { while (n >= v) { result += r; n -= v; } }
    return result;
}

