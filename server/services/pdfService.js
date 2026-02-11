const PDFDocument = require('pdfkit');

exports.generateGradeSheet = (res, data) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly to the response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('COLLEGE ERP - SEMESTER GRADE SHEET', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Name: ${data.studentName}`);
    doc.text(`Register Number: ${data.registerNumber}`);
    doc.text(`Department: ${data.department}`);
    doc.text(`Semester: ${data.semester}`);
    doc.moveDown();

    // Subject Table Header
    const tableTop = 200;
    doc.fontSize(10);
    doc.text('Subject Code', 50, tableTop);
    doc.text('Subject Name', 150, tableTop);
    doc.text('Credits', 350, tableTop);
    doc.text('Grade', 400, tableTop);
    doc.text('Status', 450, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Content
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

    // GPA info
    doc.fontSize(12).text(`GPA: ${data.gpa.toFixed(2)}`, 50, y);
    doc.text(`Result: ${data.resultStatus}`, 150, y);

    doc.end();
};

exports.generateTranscript = (res, data) => {
    // Similar to generateGradeSheet but consolidated for all semesters
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('OFFICIAL TRANSCRIPT', { align: 'center' });
    // ... Implementation for consolidated transcript ...
    doc.end();
};
