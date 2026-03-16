const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

const uploadArrears = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return res.status(400).json({ message: 'Invalid Excel format' });
        }

        const errors = [];
        let addedCount = 0;

        const rows = worksheet.getRows(2, worksheet.rowCount - 1);
        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        for (const row of rows) {
            const registerNumber = row.getCell(1).value?.toString().trim();
            const subjectCode = row.getCell(2).value?.toString().trim();
            const semesterStr = row.getCell(3).value?.toString().trim();
            const internalMarksStr = row.getCell(4).value?.toString().trim();
            const currentSemStr = row.getCell(5).value?.toString().trim();

            if (!registerNumber || !subjectCode || !semesterStr || !currentSemStr) {
                if (registerNumber || subjectCode) {
                    errors.push(`Row ${row.number}: Missing required fields`);
                }
                continue;
            }

            const semester = parseInt(semesterStr);
            const currentSem = parseInt(currentSemStr);
            const internalMarks = internalMarksStr ? parseFloat(internalMarksStr) : null;

            let student = await prisma.student.findUnique({ where: { registerNumber } });
            if (!student) {
                student = await prisma.student.findUnique({ where: { rollNo: registerNumber } });
                if (!student) {
                    errors.push(`Row ${row.number}: Student '${registerNumber}' not found.`);
                    continue;
                }
            }

            const subject = await prisma.subject.findUnique({ where: { code: subjectCode } });
            if (!subject) {
                errors.push(`Row ${row.number}: Subject '${subjectCode}' not found.`);
                continue;
            }

            const arrear = await prisma.arrear.upsert({
                where: { studentId_subjectId: { studentId: student.id, subjectId: subject.id } },
                update: {},
                create: { studentId: student.id, subjectId: subject.id, semester, attemptCount: 0, isCleared: false }
            });

            await prisma.arrear.update({ where: { id: arrear.id }, data: { attemptCount: { increment: 1 } } });

            const existingAttempt = await prisma.arrearAttempt.findFirst({
                where: { arrearId: arrear.id, semester: currentSem }
            });

            if (!existingAttempt) {
                await prisma.arrearAttempt.create({
                    data: { arrearId: arrear.id, semester: currentSem, internalMarks }
                });
                addedCount++;
            } else if (internalMarks !== null && existingAttempt.internalMarks === null) {
                await prisma.arrearAttempt.update({ where: { id: existingAttempt.id }, data: { internalMarks } });
                addedCount++;
            } else {
                errors.push(`Row ${row.number}: Attempt already exists for semester ${currentSem}.`);
            }
        }

        res.json({
            message: `Successfully processed ${addedCount} arrear registrations.`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        res.status(500).json({ message: 'Error processing file', error: error.message });
    }
};

// ─── Auto-generate arrears from EndSemMarks failures ───────────────────────
const autoGenerateArrears = async (req, res) => {
    try {
        const { semester } = req.body;
        if (!semester) return res.status(400).json({ message: 'Semester is required' });

        const semInt = parseInt(semester);

        // Find all FAIL or ABSENT EndSemMarks for subjects in this semester
        const failedMarks = await prisma.marks.findMany({
            where: {
                subject: { semester: semInt },
                endSemMarks: {
                    resultStatus: { in: ['FAIL'] }
                }
            },
            include: {
                endSemMarks: true,
                subject: true,
                student: true
            }
        });

        let created = 0;
        let skipped = 0;
        const errors = [];

        for (const markRecord of failedMarks) {
            try {
                const { studentId, subjectId, internal } = markRecord;
                const originalSemester = markRecord.subject.semester;

                // Upsert arrear header (no duplicates)
                const arrear = await prisma.arrear.upsert({
                    where: { studentId_subjectId: { studentId, subjectId } },
                    update: {},
                    create: {
                        studentId,
                        subjectId,
                        semester: originalSemester,
                        attemptCount: 0,
                        isCleared: false
                    }
                });

                // Check if an un-resolved attempt already exists
                const existingAttempt = await prisma.arrearAttempt.findFirst({
                    where: { arrearId: arrear.id, resultStatus: null }
                });

                if (!existingAttempt) {
                    await prisma.arrearAttempt.create({
                        data: {
                            arrearId: arrear.id,
                            semester: semInt,
                            internalMarks: internal || null
                        }
                    });
                    await prisma.arrear.update({
                        where: { id: arrear.id },
                        data: { attemptCount: { increment: 1 } }
                    });
                    created++;
                } else {
                    skipped++;
                }
            } catch (err) {
                errors.push(`StudentId ${markRecord.studentId} / SubjectId ${markRecord.subjectId}: ${err.message}`);
            }
        }

        res.json({
            message: `Auto-generated ${created} arrear records. ${skipped} already existed (skipped).`,
            created,
            skipped,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        res.status(500).json({ message: 'Error auto-generating arrears', error: error.message });
    }
};

// ─── Get all arrears (with optional passed-out filter) ─────────────────────
const getArrears = async (req, res) => {
    try {
        const { type } = req.query; // type = 'active' | 'passedout' | undefined (all)

        let studentFilter = {};
        if (type === 'active') {
            studentFilter = { student: { status: { not: 'PASSED_OUT' } } };
        } else if (type === 'passedout') {
            studentFilter = { student: { status: 'PASSED_OUT' } };
        }

        const arrears = await prisma.arrear.findMany({
            where: {
                isCleared: false,
                ...studentFilter
            },
            include: {
                student: { select: { name: true, registerNumber: true, rollNo: true, status: true, department: true } },
                subject: { select: { code: true, name: true, subjectCategory: true } },
                attempts: { orderBy: { id: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(arrears);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching arrear records', error: error.message });
    }
};

const deleteArrear = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.arrearAttempt.deleteMany({ where: { arrearId: parseInt(id) } });
        await prisma.arrear.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Arrear record and attempts deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting arrear record', error: error.message });
    }
};

const bulkUploadPassedOutArrears = async (req, res) => {
    const { records } = req.body;
    try {
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: 'No records provided' });
        }

        let added = 0;
        const errors = [];

        for (const r of records) {
            const { registerNumber, subjectCode, semester } = r;
            if (!registerNumber || !subjectCode) continue;

            const student = await prisma.student.findFirst({
                where: {
                    OR: [
                        { registerNumber },
                        { rollNo: registerNumber }
                    ]
                }
            });
            if (!student) { errors.push(`Student not found: ${registerNumber}`); continue; }

            const subject = await prisma.subject.findFirst({
                where: {
                    OR: [
                        { code: subjectCode },
                        { name: subjectCode }
                    ]
                }
            });
            if (!subject) { errors.push(`Subject not found: ${subjectCode}`); continue; }

            const semNum = parseInt(semester) || student.semester;

            // Skip duplicates
            const exists = await prisma.arrear.findFirst({
                where: { studentId: student.id, subjectId: subject.id, semester: semNum }
            });
            if (exists) continue;

            const arrear = await prisma.arrear.create({
                data: { studentId: student.id, subjectId: subject.id, semester: semNum }
            });
            await prisma.arrearAttempt.create({
                data: { arrearId: arrear.id, semester: semNum }
            });
            added++;
        }

        res.json({ message: `Created ${added} arrear records`, count: added, errors });
    } catch (error) {
        res.status(500).json({ message: 'Error bulk uploading passed-out arrears', error: error.message });
    }
};

module.exports = {
    uploadArrears,
    autoGenerateArrears,
    getArrears,
    deleteArrear,
    bulkUploadPassedOutArrears
};
