const prisma = require('../lib/prisma');
const { getDeptCriteria } = require('../utils/deptUtils');
const { handleError } = require('../utils/errorUtils');

exports.generateMapping = async (req, res) => {
    try {
        const { department, semester, subjectId, startingDummy, boardCode, qpCode, absentStudentIds = [] } = req.body;

        const subIdInt = parseInt(subjectId);
        const semInt = parseInt(semester);

        // 🧱 GATEKEEPING: Check if Internal Marks are approved for this subject
        const internalApproved = await prisma.marks.findFirst({
            where: { subjectId: subIdInt, isApproved: true }
        });

        if (!internalApproved) {
            return res.status(400).json({ message: "Internal marks must be approved before generating dummy numbers." });
        }

        // 1. Fetch regular students via enrollment in Marks table
        const enrolledStudents = await prisma.marks.findMany({
            where: {
                subjectId: subIdInt,
                student: { semester: semInt }
            },
            include: { student: true },
            orderBy: { student: { registerNumber: 'asc' } }
        });

        const regularStudents = enrolledStudents.map(m => m.student);

        // 1b. Fetch arrear students
        const activeArrearAttempts = await prisma.arrearAttempt.findMany({
            where: {
                arrear: { subjectId: subIdInt },
                resultStatus: null
            },
            include: {
                arrear: { include: { student: true } }
            }
        });

        const arrearStudents = activeArrearAttempts.map(attempt => attempt.arrear.student);

        // Combine and deduplicate
        const allStudentsMap = new Map();
        [...regularStudents, ...arrearStudents].forEach(s => {
            if (s && !allStudentsMap.has(s.id)) allStudentsMap.set(s.id, s);
        });

        const students = Array.from(allStudentsMap.values()).sort((a, b) => {
            const regA = a.registerNumber || a.rollNo || '';
            const regB = b.registerNumber || b.rollNo || '';
            return regA.localeCompare(regB);
        });

        if (students.length === 0) {
            return res.status(404).json({ message: "No students or arrear candidates found" });
        }

        // 2. Fetch subject
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ message: "Subject not found" });

        // 3. Check if mapping already exists and is locked
        const existingLocked = await prisma.subjectDummyMapping.findFirst({
            where: { subjectId: subIdInt, semester: semInt, mappingLocked: true }
        });

        if (existingLocked) {
            return res.status(400).json({ message: "Mapping is locked and cannot be regenerated" });
        }

        // 🧱 UNIQUE CHECK: Check if any of the new dummy numbers are already used in this session/semester for OTHER subjects
        const count = students.filter(s => !absentStudentIds.includes(s.id)).length;
        const start = parseInt(startingDummy);
        const end = start + count - 1;
        const requestedDummies = Array.from({ length: count }, (_, i) => (start + i).toString());

        const duplicateCheck = await prisma.subjectDummyMapping.findFirst({
            where: {
                semester: semInt,
                subjectId: { not: subIdInt },
                dummyNumber: { in: requestedDummies }
            },
            select: { dummyNumber: true, subjectCode: true }
        });

        if (duplicateCheck) {
            return res.status(400).json({
                message: `Dummy number ${duplicateCheck.dummyNumber} is already used for subject ${duplicateCheck.subjectCode}. Please use a different starting number.`
            });
        }

        // 4. Process mappings inside a transaction
        let currentDummy = start;
        await prisma.$transaction(async (tx) => {
            for (const student of students) {
                const isAbsent = absentStudentIds.includes(student.id);
                let dummyNumber = null;

                if (!isAbsent) {
                    dummyNumber = currentDummy.toString();
                    currentDummy++;
                }

                await tx.subjectDummyMapping.upsert({
                    where: {
                        studentId_subjectId: {
                            studentId: student.id,
                            subjectId: subIdInt
                        }
                    },
                    update: {
                        dummyNumber,
                        isAbsent,
                        boardCode: boardCode || null,
                        qpCode: qpCode || null,
                        department: student.department || department,
                        semester: semInt,
                        section: student.section || 'A'
                    },
                    create: {
                        studentId: student.id,
                        originalRegisterNo: student.registerNumber || student.rollNo,
                        subjectId: subIdInt,
                        subjectCode: subject.code,
                        department: student.department || department,
                        semester: semInt,
                        section: student.section || 'A',
                        academicYear: process.env.ACADEMIC_YEAR || "24-25",
                        dummyNumber,
                        isAbsent,
                        boardCode: boardCode || null,
                        qpCode: qpCode || null
                    }
                });
            }
        });

        res.json({ message: "Dummy numbers processed successfully" });
    } catch (error) {
        handleError(res, error, "Failed to generate mapping");
    }
};

exports.getAvailableSubjectsForDummy = async (req, res) => {
    try {
        const { semester, department } = req.query;
        const semInt = semester ? parseInt(semester) : null;

        // Subjects with at least one approved internal mark student
        const approvedSubjectIds = (await prisma.marks.findMany({
            where: { isApproved: true },
            select: { subjectId: true },
            distinct: ['subjectId']
        })).map(m => m.subjectId);

        const availableSubjects = await prisma.subject.findMany({
            where: {
                id: { in: approvedSubjectIds },
                // If it's theory or integrated
                subjectCategory: { in: ['THEORY', 'INTEGRATED'] },
                department: department || undefined,
                ...(semInt && { semester: semInt })
            },
            include: {
                dummyMappings: {
                    where: { semester: semInt },
                    take: 1
                }
            }
        });

        const results = availableSubjects.map(sub => ({
            id: sub.id,
            code: sub.code,
            name: sub.name,
            subjectCategory: sub.subjectCategory,
            isIntegrated: sub.subjectCategory === 'INTEGRATED',
            hasMapping: sub.dummyMappings.length > 0,
            mappingLocked: sub.dummyMappings[0]?.mappingLocked || false
        }));

        res.json(results);
    } catch (error) {
        handleError(res, error, "Failed to get available subjects for dummy mapping");
    }
};

exports.getMapping = async (req, res) => {
    try {
        const { department, semester, subjectId } = req.query;
        // Fetch all regular students via enrollment in Marks table
        const enrolledStudents = await prisma.marks.findMany({
            where: {
                subjectId: parseInt(subjectId),
                student: { semester: parseInt(semester) }
            },
            include: {
                student: {
                    include: {
                        dummyMappings: {
                            where: { subjectId: parseInt(subjectId) }
                        }
                    }
                }
            }
        });

        const regularStudents = enrolledStudents.map(m => m.student);

        // Fetch arrear students for this subject
        const activeArrearAttempts = await prisma.arrearAttempt.findMany({
            where: {
                arrear: { subjectId: parseInt(subjectId) },
                resultStatus: null
            },
            include: {
                arrear: {
                    include: {
                        student: {
                            include: {
                                dummyMappings: {
                                    where: { subjectId: parseInt(subjectId) }
                                }
                            }
                        }
                    }
                }
            }
        });

        const arrearStudents = activeArrearAttempts.map(attempt => {
            const student = attempt.arrear.student;
            student.isArrear = true; // flag for frontend if needed
            return student;
        });

        // Combine and deduplicate
        const allStudentsMap = new Map();
        [...regularStudents, ...arrearStudents].forEach(s => {
            if (s && !allStudentsMap.has(s.id)) {
                allStudentsMap.set(s.id, s);
            }
        });

        const students = Array.from(allStudentsMap.values()).sort((a, b) => {
            const regA = a.registerNumber || a.rollNo || '';
            const regB = b.registerNumber || b.rollNo || '';
            return regA.localeCompare(regB);
        });

        const results = students.map(student => {
            const mapping = student.dummyMappings[0] || null;
            return {
                id: mapping?.id || `temp-${student.id}`,
                studentId: student.id,
                student: { name: student.name },
                originalRegisterNo: student.registerNumber || student.rollNo,
                dummyNumber: mapping?.dummyNumber || null,
                isAbsent: mapping?.isAbsent || false,
                boardCode: mapping?.boardCode || '',
                qpCode: mapping?.qpCode || '',
                marks: mapping?.marks || null,
                mappingLocked: mapping?.mappingLocked || false,
                isTemp: !mapping,
                isArrear: student.isArrear || false
            };
        });

        res.json(results);
    } catch (error) {
        handleError(res, error, "Failed to get dummy mapping");
    }
};

exports.lockMapping = async (req, res) => {
    try {
        const { semester, subjectId } = req.body;
        await prisma.subjectDummyMapping.updateMany({
            where: {
                semester: parseInt(semester),
                subjectId: parseInt(subjectId)
            },
            data: { mappingLocked: true }
        });
        res.json({ message: "Mapping locked successfully" });
    } catch (error) {
        handleError(res, error, "Failed to lock mapping");
    }
};

exports.unlockMapping = async (req, res) => {
    try {
        const { semester, subjectId } = req.body;
        await prisma.subjectDummyMapping.updateMany({
            where: {
                semester: parseInt(semester),
                subjectId: parseInt(subjectId)
            },
            data: { mappingLocked: false }
        });
        res.json({ message: "Mapping unlocked successfully" });
    } catch (error) {
        handleError(res, error, "Failed to unlock mapping");
    }
};

exports.saveMarks = async (req, res) => {
    // Basic fallback for marks entry if done via admin module
    try {
        const { mappings } = req.body; // Array of { id, marks }
        await prisma.$transaction(
            mappings.map(m => prisma.subjectDummyMapping.update({
                where: { id: parseInt(m.id) },
                data: { marks: parseFloat(m.marks) }
            }))
        );
        res.json({ message: "Marks saved successfully" });
    } catch (error) {
        handleError(res, error, "Failed to save marks");
    }
};

exports.approveMarks = async (req, res) => {
    try {
        const { semester, subjectId } = req.body;
        const subIdInt = parseInt(subjectId);

        await prisma.$transaction(async (tx) => {
            // 1. Mark the actual dummy records as approved
            await tx.externalMark.updateMany({
                where: { subjectId: subIdInt },
                data: { 
                    isApproved: true,
                    status: 'APPROVED'
                }
            });

            // 2. Lock the dummy mappings if not already
            await tx.subjectDummyMapping.updateMany({
                where: { subjectId: subIdInt },
                data: { mappingLocked: true }
            });
        });

        res.json({ message: "External marks approved successfully." });
    } catch (error) {
        handleError(res, error, "Failed to approve marks");
    }
};

exports.rejectMarks = async (req, res) => {
    try {
        const { subjectId, reason } = req.body;
        const subIdInt = parseInt(subjectId);

        await prisma.$transaction(async (tx) => {
            // 1. Mark external marks as rejected
            await tx.externalMark.updateMany({
                where: { subjectId: subIdInt },
                data: { 
                    isApproved: false,
                    status: 'REJECTED',
                    rejectionReason: reason || "Administrative rejection"
                }
            });

            // 2. Re-open the assignment for external staff
            await tx.externalMarkAssignment.updateMany({
                where: { subjectId: subIdInt },
                data: { status: 'OPEN' }
            });
        });

        res.json({ message: "External marks rejected. Assignment re-opened for staff." });
    } catch (error) {
        handleError(res, error, "Failed to reject marks");
    }
};
