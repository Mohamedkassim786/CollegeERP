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

        const newArrears = [];
        const errors = [];
        let addedCount = 0;

        // Start from row 2 to skip headers
        const rows = worksheet.getRows(2, worksheet.rowCount - 1);
        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        for (const row of rows) {
            const registerNumber = row.getCell(1).value?.toString().trim();
            const subjectCode = row.getCell(2).value?.toString().trim();
            const semesterStr = row.getCell(3).value?.toString().trim();
            const internalMarksStr = row.getCell(4).value?.toString().trim();
            const currentSemStr = row.getCell(5).value?.toString().trim(); // the sem in which they are attempting

            if (!registerNumber || !subjectCode || !semesterStr || !currentSemStr) {
                if (registerNumber || subjectCode) { // Avoid logging completely empty rows
                    errors.push(`Row ${row.number}: Missing required fields (RegisterNumber, SubjectCode, Semester, CurrentAttemptSemester)`);
                }
                continue;
            }

            const semester = parseInt(semesterStr);
            const currentSem = parseInt(currentSemStr);
            const internalMarks = internalMarksStr ? parseFloat(internalMarksStr) : null;

            // Find Student
            let student = await prisma.student.findUnique({
                where: { registerNumber }
            });

            if (!student) {
                // Try roll number fallback
                const fallbackStudent = await prisma.student.findUnique({
                    where: { rollNo: registerNumber }
                });

                if (!fallbackStudent) {
                    errors.push(`Row ${row.number}: Student with RegisterNumber ${registerNumber} not found.`);
                    continue;
                } else {
                    student = fallbackStudent;
                }
            }

            // Find Subject
            const subject = await prisma.subject.findUnique({
                where: { code: subjectCode }
            });

            if (!subject) {
                errors.push(`Row ${row.number}: Subject with Code ${subjectCode} not found.`);
                continue;
            }

            // Upsert Arrear Header
            const arrear = await prisma.arrear.upsert({
                where: {
                    studentId_subjectId: {
                        studentId: student.id,
                        subjectId: subject.id
                    }
                },
                update: {}, // Don't reset anything if it exists
                create: {
                    studentId: student.id,
                    subjectId: subject.id,
                    semester: semester, // original semester
                    attemptCount: 0,
                    isCleared: false
                }
            });

            // Auto-increment the attempt count for this new registration
            const updatedArrear = await prisma.arrear.update({
                where: { id: arrear.id },
                data: {
                    attemptCount: { increment: 1 }
                }
            });

            // Check if there is already an attempt active for this specific current semester
            const existingAttempt = await prisma.arrearAttempt.findFirst({
                where: {
                    arrearId: arrear.id,
                    semester: currentSem
                }
            });

            if (!existingAttempt) {
                await prisma.arrearAttempt.create({
                    data: {
                        arrearId: arrear.id,
                        semester: currentSem,
                        internalMarks: internalMarks
                    }
                });
                addedCount++;
            } else if (internalMarks !== null && existingAttempt.internalMarks === null) {
                // Update internal marks if they were missing before
                await prisma.arrearAttempt.update({
                    where: { id: existingAttempt.id },
                    data: { internalMarks: internalMarks }
                });
                addedCount++;
            } else {
                errors.push(`Row ${row.number}: Arrear attempt already exists for this semester.`);
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

const getArrears = async (req, res) => {
    try {
        const arrears = await prisma.arrear.findMany({
            include: {
                student: {
                    select: { name: true, registerNumber: true, rollNo: true }
                },
                subject: {
                    select: { code: true, name: true }
                },
                attempts: true
            }
        });

        res.json(arrears);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching arrear records', error: error.message });
    }
};

const deleteArrear = async (req, res) => {
    try {
        const { id } = req.params;

        // Deleting attempts first due to relation
        await prisma.arrearAttempt.deleteMany({
            where: { arrearId: parseInt(id) }
        });

        await prisma.arrear.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Arrear record and attempts deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting arrear record', error: error.message });
    }
};

module.exports = {
    uploadArrears,
    getArrears,
    deleteArrear
};
