const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdfService');
const { getDeptCriteria } = require('../utils/deptUtils');

// --- End Semester Mark Entry ---

exports.getEndSemMarks = async (req, res) => {
    try {
        const { department, year, semester, section, subjectId, page = 1, limit = 50 } = req.query;
        const subIdInt = parseInt(subjectId);
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // 1. Fetch students for the criteria
        // We include regular students in the current semester AND any students who have dummy mappings for this subject (Arrears)
        const deptFilter = await getDeptCriteria(department);
        const students = await prisma.student.findMany({
            where: {
                OR: [
                    {
                        ...deptFilter,
                        year: parseInt(year),
                        semester: parseInt(semester),
                        section
                    },
                    {
                        dummyMappings: {
                            some: { subjectId: subIdInt }
                        }
                    }
                ]
            },
            include: {
                marks: {
                    where: { subjectId: subIdInt },
                    include: { endSemMarks: true }
                },
                dummyMappings: {
                    where: { subjectId: subIdInt }
                }
            }
        });

        // 2. Fetch external marks for this subject
        const externalMarks = await prisma.externalMark.findMany({
            where: { subjectId: subIdInt, isApproved: true }
        });

        const extMarksMap = {};
        externalMarks.forEach(em => {
            extMarksMap[em.dummyNumber] = em;
        });

        // 3. Consolidate data
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        const category = subject?.subjectCategory || 'THEORY';

        const consolidated = students.map(student => {
            const ciaRecord = student.marks[0] || {};
            const dummyMapping = student.dummyMappings[0] || {};

            // For THEORY: lookup by dummy number. For LAB/INTEGRATED: lookup by register number (no dummy masking)
            const lookupKey = (category === 'LAB' || category === 'INTEGRATED')
                ? student.registerNumber
                : dummyMapping.dummyNumber;
            const extRecord = extMarksMap[lookupKey] || {};

            // Internal conversion depends on category
            let internalProcessed = 0;
            if ((ciaRecord.internal !== undefined && ciaRecord.internal !== null) && ciaRecord.isApproved) {
                if (category === 'LAB') {
                    internalProcessed = ciaRecord.internal; // already stored as /60 in markService
                } else if (category === 'INTEGRATED') {
                    // Internal is 50 (theory25 + lab25)
                    internalProcessed = ciaRecord.internal;
                } else {
                    // THEORY: internal is /100, convert to 40%
                    internalProcessed = Math.round(ciaRecord.internal * 0.4);
                }
            }

            const isAbsent = dummyMapping.isAbsent || false;
            let externalProcessed = 0;
            if (!isAbsent) {
                if (category === 'LAB') {
                    externalProcessed = extRecord.rawExternal100 || 0; // stored /40
                } else if (category === 'INTEGRATED') {
                    externalProcessed = extRecord.rawExternal100 || 0; // stored /50
                } else {
                    externalProcessed = extRecord.convertedExternal60 ? Math.round(extRecord.convertedExternal60) : 0;
                }
            }

            const total100 = isAbsent ? 'AB' : (internalProcessed + externalProcessed);

            // Add CIA totals to help frontend show breakdown for integrated subjects
            const calculateSum = (t, a, att) => {
                const parseVal = (v) => (v === -1 || v === null || v === undefined ? 0 : parseFloat(v) || 0);
                return parseVal(t) + parseVal(a) + parseVal(att);
            };

            return {
                id: student.id,
                name: student.name,
                registerNumber: student.registerNumber,
                rollNo: student.rollNo,
                internal40: internalProcessed,
                external60: isAbsent ? 'AB' : externalProcessed,
                total100,
                dummyNumber: dummyMapping.dummyNumber || student.registerNumber,
                isLocked: ciaRecord.endSemMarks?.isLocked || false,
                isPublished: ciaRecord.endSemMarks?.isPublished || false,
                grade: ciaRecord.endSemMarks?.grade || 'N/A',
                resultStatus: ciaRecord.endSemMarks?.resultStatus || 'N/A',
                // Breakdown fields for Integrated
                cia1: calculateSum(ciaRecord.cia1_test, ciaRecord.cia1_assignment, ciaRecord.cia1_attendance),
                cia2: calculateSum(ciaRecord.cia2_test, ciaRecord.cia2_assignment, ciaRecord.cia2_attendance),
                cia3: calculateSum(ciaRecord.cia3_test, ciaRecord.cia3_assignment, ciaRecord.cia3_attendance),
                lab: (parseFloat(ciaRecord.lab_attendance) || 0) + (parseFloat(ciaRecord.lab_observation) || 0) + (parseFloat(ciaRecord.lab_record) || 0) + (parseFloat(ciaRecord.lab_model) || 0)
            };
        });


        res.json(consolidated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateEndSemMarks = async (req, res) => {
    try {
        const { subjectId, semester, regulation = '2021' } = req.body;
        const subIdInt = parseInt(subjectId);

        const resultCount = await prisma.$transaction(async (tx) => {
            // 1. Fetch the subject to get its category
            const subject = await tx.subject.findUnique({ where: { id: subIdInt } });
            const subjectCategory = subject?.subjectCategory || 'THEORY';
            const isLabOrIntegrated = subjectCategory === 'LAB' || subjectCategory === 'INTEGRATED';

            // 2. Fetch students based on category:
            //    THEORY → must have dummyMapping (needed for absent flag & extRecord key)
            //    LAB/INTEGRATED → just need a marks record (no dummy mapping)
            const studentWhere = isLabOrIntegrated
                ? { marks: { some: { subjectId: subIdInt } } }
                : {
                    marks: { some: { subjectId: subIdInt } },
                    dummyMappings: { some: { subjectId: subIdInt } }
                };

            const students = await tx.student.findMany({
                where: studentWhere,
                include: {
                    marks: { where: { subjectId: subIdInt }, include: { endSemMarks: true } },
                    dummyMappings: { where: { subjectId: subIdInt } },
                    attendance: { where: { subjectId: subIdInt } }
                }
            });

            const externalMarks = await tx.externalMark.findMany({
                where: { subjectId: subIdInt, isApproved: true }
            });
            // Key by dummyNumber (which is registerNumber for LAB/INTEGRATED)
            const extMarksMap = {};
            externalMarks.forEach(em => { extMarksMap[em.dummyNumber] = em; });

            const grades = await tx.gradeSettings.findMany({ where: { regulation } });

            let count = 0;
            const skipped = [];

            for (const student of students) {
                const ciaRecord = student.marks[0];
                if (!ciaRecord) {
                    skipped.push({ studentId: student.id, name: student.name, reason: 'No CIA marks' });
                    continue;
                }

                // For THEORY: use dummyMapping for absent flag and extRecord key
                // For LAB/INTEGRATED: use registerNumber as extRecord key, no absent flag from mapping
                const dummyMapping = student.dummyMappings[0] || null;
                const isAbsent = isLabOrIntegrated ? false : (dummyMapping?.isAbsent || false);

                // Lookup key for external marks
                const extLookupKey = isLabOrIntegrated
                    ? student.registerNumber
                    : (dummyMapping?.dummyNumber || null);

                if (!isLabOrIntegrated && !dummyMapping) {
                    skipped.push({ studentId: student.id, name: student.name, reason: 'No dummy mapping' });
                    continue;
                }

                const extRecord = extLookupKey ? extMarksMap[extLookupKey] : null;
                if (!isAbsent && !extRecord) continue;
                if (ciaRecord.endSemMarks?.isLocked || ciaRecord.endSemMarks?.isPublished) continue;

                // ── Mark calculation based on subject category ──────────────────
                let internalVal = 0;
                let externalVal = 0;
                let rawExternal = 0;
                let finalGrade = 'RA';
                let finalResultStatus = 'FAIL';

                if (isAbsent) {
                    finalGrade = 'AB';
                    finalResultStatus = 'FAIL';
                } else if (subjectCategory === 'LAB') {
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved)
                        ? Math.round((ciaRecord.internal / 100) * 60)
                        : 0;
                    rawExternal = extRecord?.rawExternal100 || 0;
                    externalVal = rawExternal;

                    const totalMarks = Math.round(internalVal + externalVal);
                    const isExternalPass = rawExternal >= 20;

                    const matchedGrade = grades.find(g => totalMarks >= g.minPercentage && totalMarks <= g.maxPercentage)
                        || { grade: 'RA', resultStatus: 'FAIL' };

                    finalResultStatus = (matchedGrade.resultStatus === 'PASS' && isExternalPass) ? 'PASS' : 'FAIL';
                    finalGrade = finalResultStatus === 'PASS' ? matchedGrade.grade : 'RA';

                } else if (subjectCategory === 'INTEGRATED') {
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved) ? ciaRecord.internal : 0;
                    rawExternal = extRecord?.rawExternal100 || 0;
                    externalVal = rawExternal;

                    const totalMarks = Math.round(internalVal + externalVal);
                    const internalPass = internalVal >= 25;
                    const externalPass = externalVal >= 25;

                    const matchedGrade = grades.find(g => totalMarks >= g.minPercentage && totalMarks <= g.maxPercentage)
                        || { grade: 'RA', resultStatus: 'FAIL' };

                    finalResultStatus = (matchedGrade.resultStatus === 'PASS' && internalPass && externalPass) ? 'PASS' : 'FAIL';
                    finalGrade = finalResultStatus === 'PASS' ? matchedGrade.grade : 'RA';

                } else {
                    // THEORY
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved) ? ciaRecord.internal * 0.4 : 0;
                    rawExternal = extRecord?.rawExternal100 || 0;
                    externalVal = extRecord?.convertedExternal60 || 0;

                    const totalMarks = Math.round(internalVal + externalVal);
                    const isExternalPass = rawExternal >= 50;

                    const matchedGrade = grades.find(g => totalMarks >= g.minPercentage && totalMarks <= g.maxPercentage)
                        || { grade: 'RA', resultStatus: 'FAIL' };

                    finalResultStatus = (matchedGrade.resultStatus === 'PASS' && isExternalPass) ? 'PASS' : 'FAIL';
                    finalGrade = finalResultStatus === 'PASS' ? matchedGrade.grade : 'RA';
                }

                const totalMarks = Math.round(
                    subjectCategory === 'THEORY'
                        ? (ciaRecord.isApproved ? ciaRecord.internal * 0.4 : 0) + externalVal
                        : internalVal + externalVal
                );

                // ── Attendance Snapshot ─────────────────────────────────────────
                const totalClasses = student.attendance.length;
                const presentCount = student.attendance.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
                const attPercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

                await tx.endSemMarks.upsert({
                    where: { marksId: ciaRecord.id },
                    update: {
                        externalMarks: isAbsent ? 0 : rawExternal,
                        totalMarks,
                        grade: finalGrade,
                        resultStatus: finalResultStatus,
                        attendanceSnapshot: attPercentage
                    },
                    create: {
                        marksId: ciaRecord.id,
                        externalMarks: isAbsent ? 0 : rawExternal,
                        totalMarks,
                        grade: finalGrade,
                        resultStatus: finalResultStatus,
                        attendanceSnapshot: attPercentage
                    }
                });

                // ── Arrear Propagation ─────────────────────────────────────────
                const arrear = await tx.arrear.findUnique({
                    where: { studentId_subjectId: { studentId: student.id, subjectId: subIdInt } }
                });

                if (arrear && !arrear.isCleared) {
                    await tx.arrearAttempt.updateMany({
                        where: { arrearId: arrear.id, resultStatus: null },
                        data: {
                            externalMarks: rawExternal,
                            totalMarks,
                            grade: finalGrade,
                            resultStatus: finalResultStatus,
                            semester: student.semester
                        }
                    });

                    if (finalResultStatus === 'PASS') {
                        await tx.arrear.update({
                            where: { id: arrear.id },
                            data: { isCleared: true, clearedInSem: student.semester }
                        });
                    }
                }

                count++;
            }
            return { count, skipped };
        });

        res.json({
            message: "Consolidated marks updated and grades calculated",
            count: resultCount.count,
            skippedCount: resultCount.skipped.length,
            skipped: resultCount.skipped
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// --- GPA/CGPA Engine ---


exports.calculateGPA = async (req, res) => {
    try {
        const { studentId, semester } = req.body;
        const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
        if (!student) return res.status(404).json({ message: "Student not found" });

        const regulation = student.regulation || '2021';
        const grades = await prisma.gradeSettings.findMany({ where: { regulation } });
        const marks = await prisma.marks.findMany({
            where: { studentId: parseInt(studentId) },
            include: { subject: true, endSemMarks: true }
        });

        // Filter marks for current semester
        const currentSemMarks = marks.filter(m => m.subject.semester === parseInt(semester));

        let totalPoints = 0;
        let totalCredits = 0;
        let earnedCredits = 0;
        let semesterPass = true;

        for (const m of currentSemMarks) {
            const credits = m.subject.credits || 3;
            if (!m.endSemMarks || m.endSemMarks.resultStatus === 'FAIL') {
                semesterPass = false;
                totalCredits += credits;
                continue;
            }

            const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
            const gp = gradeInfo ? gradeInfo.gradePoint : 0;

            totalPoints += gp * credits;
            totalCredits += credits;
            earnedCredits += credits;
        }

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

        // CGPA calculation (all past semesters + cleared arrears)
        let cumulativePoints = 0;
        let cumulativeCredits = 0;

        // Fetch all cleared arrears for this student
        const clearedArrears = await prisma.arrear.findMany({
            where: { studentId: parseInt(studentId), isCleared: true },
            include: { subject: true }
        });

        // 1. Process standard marks (Regular attempts in current/past semesters)
        for (const m of marks) {
            if (m.subject.semester <= parseInt(semester)) {
                const isClearedArrear = clearedArrears.some(ar => ar.subjectId === m.subjectId);
                const credits = m.subject.credits || 3;

                if (m.endSemMarks && m.endSemMarks.resultStatus === 'PASS') {
                    // Regular pass — add points and credits
                    const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
                    cumulativePoints += (gradeInfo ? gradeInfo.gradePoint : 0) * credits;
                    cumulativeCredits += credits;
                } else if (isClearedArrear) {
                    // This subject was failed initially but cleared in an arrear attempt.
                    // ONLY add credits to denominator here (points will be added in the arrear block).
                    // Do NOT add again in the arrear block.
                    cumulativeCredits += credits;
                }
                // If it's still a fail (not cleared) — do not count credits or points
            }
        }

        // 2. Process Arrear Points (Points earned in recovery)
        for (const ar of clearedArrears) {
            // Find the successful attempt
            const attempt = await prisma.arrearAttempt.findFirst({
                where: { arrearId: ar.id, resultStatus: 'PASS' },
                orderBy: { id: 'desc' }
            });

            if (attempt) {
                const gradeInfo = grades.find(g => g.grade === attempt.grade);
                // Add ONLY the grade points. Credits were already counted in the standard marks loop above.
                cumulativePoints += (gradeInfo ? gradeInfo.gradePoint : 0) * (ar.subject.credits || 3);
                // NOTE: Do NOT increment cumulativeCredits here — already counted above to avoid double-counting.
            }
        }

        const cgpa = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits) : 0;

        await prisma.semesterResult.upsert({
            where: {
                studentId_semester: {
                    studentId: parseInt(studentId),
                    semester: parseInt(semester)
                }
            },
            update: {
                gpa,
                cgpa,
                totalCredits,
                earnedCredits,
                resultStatus: semesterPass ? "PASS" : "FAIL"
            },
            create: {
                studentId: parseInt(studentId),
                semester: parseInt(semester),
                gpa,
                cgpa,
                totalCredits,
                earnedCredits,
                resultStatus: semesterPass ? "PASS" : "FAIL"
            }
        });

        res.json({ gpa, cgpa, resultStatus: semesterPass ? "PASS" : "FAIL" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Faculty Result View (Read-Only) ---

exports.getFacultyResults = async (req, res) => {
    try {
        const { department, year, semester, section, subjectId } = req.query;

        // 1. Check if Results are Published
        const deptFilter = await getDeptCriteria(department);
        const control = await prisma.semesterControl.findFirst({
            where: {
                ...deptFilter,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            }
        });

        if (!control || !control.isPublished) {
            return res.status(403).json({ message: "Results for this semester have not been published yet." });
        }

        // 2. Fetch marks (Read-only)
        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            },
            include: {
                marks: {
                    where: { subjectId: parseInt(subjectId) },
                    include: { endSemMarks: true }
                },
                results: {
                    where: { semester: parseInt(semester) }
                }
            }
        });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Semester Control ---

exports.toggleSemesterControl = async (req, res) => {
    try {
        const { department, year, semester, section, field, value } = req.body;

        const updateData = {};
        updateData[field] = value;

        // Find official department definition to ensure unique key consistency
        const deptDef = await prisma.department.findFirst({
            where: { OR: [{ name: department }, { code: department }] }
        });
        const officialDept = deptDef ? deptDef.name : department;

        const control = await prisma.semesterControl.upsert({
            where: {
                department_year_semester_section: {
                    department: officialDept,
                    year: parseInt(year),
                    semester: parseInt(semester),
                    section
                }
            },
            update: updateData,
            create: {
                department: officialDept,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                ...updateData
            }
        });

        // 🧱 FIX ATTENDANCE SNAPSHOT ISSUE (CRITICAL)
        if (field === 'isPublished' && value === true) {
            const deptFilter = await getDeptCriteria(officialDept);
            const students = await prisma.student.findMany({
                where: {
                    ...deptFilter,
                    year: parseInt(year),
                    semester: parseInt(semester),
                    section
                },
                include: {
                    attendance: true,
                    marks: { include: { endSemMarks: true } }
                }
            });

            for (const student of students) {
                for (const mark of student.marks) {
                    if (mark.endSemMarks) {
                        // Per-subject attendance snapshot
                        const subAttendance = student.attendance.filter(a => a.subjectId === mark.subjectId);
                        const total = subAttendance.length;
                        const present = subAttendance.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
                        const percentage = total > 0 ? (present / total) * 100 : 0;

                        await prisma.endSemMarks.update({
                            where: { id: mark.endSemMarks.id },
                            data: {
                                attendanceSnapshot: percentage,
                                isPublished: true
                            }
                        });
                    }
                }
            }
        }

        res.json(control);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSemesterControl = async (req, res) => {
    try {
        const { department, year, semester, section } = req.query;
        const deptFilter = await getDeptCriteria(department);

        const control = await prisma.semesterControl.findFirst({
            where: {
                ...deptFilter,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            }
        });

        // If no control record exists, return default status
        res.json(control || {
            markEntryOpen: false,
            isPublished: false,
            isLocked: false
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGradeSheet = async (req, res) => {
    try {
        const { studentId, semester } = req.query;

        const student = await prisma.student.findUnique({
            where: { id: parseInt(studentId) },
            include: {
                marks: {
                    include: {
                        subject: true,
                        endSemMarks: true
                    }
                },
                results: {
                    where: { semester: parseInt(semester) }
                }
            }
        });

        if (!student) return res.status(404).send('Student not found');

        const result = student.results[0] || { gpa: 0, resultStatus: 'N/A' };

        const pdfData = {
            studentName: student.name,
            registerNumber: student.registerNumber,
            department: student.department,
            semester,
            gpa: result.gpa,
            resultStatus: result.resultStatus,
            marks: student.marks.map(m => ({
                subjectCode: m.subject.code,
                subjectName: m.subject.name,
                credits: m.subject.credits,
                grade: m.endSemMarks?.grade || 'N/A',
                status: m.endSemMarks?.resultStatus || 'PENDING'
            }))
        };

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=grade_sheet_${studentId}.pdf`);

        pdfService.generateGradeSheet(res, pdfData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
