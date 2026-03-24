const prisma = require('../lib/prisma');
const pdfService = require('../services/pdf.service.js');
const { logger } = require('../utils/logger');
const { getDeptCriteria } = require('../utils/deptUtils');
const calcService = require('../services/calculation.service.js');
const { handleError } = require('../utils/errorUtils');


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

        // 2. Fetch external marks for this subject (allow pending for admin review)
        const externalMarks = await prisma.externalMark.findMany({
            where: { subjectId: subIdInt }
        });
        
        let batchStatus = 'NOT_SUBMITTED';
        if (externalMarks.length > 0) {
             const hasPending = externalMarks.some(em => em.status === 'PENDING');
             const hasRejected = externalMarks.some(em => em.status === 'REJECTED');
             if (hasPending) batchStatus = 'PENDING';
             else if (hasRejected) batchStatus = 'REJECTED';
             else batchStatus = 'APPROVED';
        }

        const extMarksMap = {};
        externalMarks.forEach(em => {
            extMarksMap[em.dummyNumber] = em;
        });

        // 3. Consolidate data
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        const category = subject?.subjectCategory || 'THEORY';

        // For INTEGRATED: build separate maps for THEORY and LAB components
        let extTheoryMap = {}, extLabMap = {};
        if (category === 'INTEGRATED') {
            const theoryMarks = externalMarks.filter(em => em.component === 'THEORY');
            const labMarks = externalMarks.filter(em => em.component === 'LAB');
            theoryMarks.forEach(em => { extTheoryMap[em.dummyNumber] = em; });
            labMarks.forEach(em => { extLabMap[em.dummyNumber] = em; });
        }

        const consolidated = students.map(student => {
            const ciaRecord = student.marks[0] || {};
            const dummyMapping = student.dummyMappings[0] || {};

            // For THEORY and INTEGRATED THEORY component: lookup by dummy number. For LAB: lookup by register number
            const lookupKey = (category === 'LAB')
                ? student.registerNumber
                : dummyMapping.dummyNumber;

            let externalProcessed = 0;
            const isAbsent = dummyMapping.isAbsent || false;

            // Internal conversion depends on category
            let internalProcessed = 0;
            if ((ciaRecord.internal !== undefined && ciaRecord.internal !== null) && ciaRecord.isApproved) {
                if (category === 'LAB') {
                    internalProcessed = ciaRecord.internal; // markService already stored /100*60
                } else if (category === 'INTEGRATED') {
                    // markService calculates theory25 + lab25 = 50
                    internalProcessed = ciaRecord.internal;
                } else {
                    // THEORY: internal is /100, convert to 40
                    internalProcessed = Math.round(ciaRecord.internal * 0.4);
                }
            }

            if (!isAbsent) {
                if (category === 'LAB') {
                    // LAB external: 40 is max
                    const extRecord = extMarksMap[lookupKey] || {};
                    const raw = extRecord.rawExternal100 || 0;
                    externalProcessed = Math.round((raw / 100) * 40);
                } else if (category === 'INTEGRATED') {
                    // Two components: THEORY (by dummyNumber) + LAB (by registerNumber) each scaled to 25
                    const theoryExt = extTheoryMap[lookupKey] || {};
                    const labExt = extLabMap[student.registerNumber] || {};
                    const tRaw = theoryExt.rawExternal100 || 0;
                    const lRaw = labExt.rawExternal100 || 0;
                    externalProcessed = Math.round((tRaw / 100) * 25) + Math.round((lRaw / 100) * 25);
                } else {
                    // THEORY: 60 is max
                    const extRecord = extMarksMap[lookupKey] || {};
                    const raw = extRecord.rawExternal100 || 0;
                    externalProcessed = Math.round((raw / 100) * 60);
                }
            }

            const total100 = isAbsent ? 'UA' : Math.round(internalProcessed + externalProcessed);

            // For INTEGRATED, expose both external components separately and SCALED/RAW
            let theoryRaw100 = null;
            let theoryExt25 = null;
            let labRaw100 = null;
            let labExt25 = null;

            if (category === 'INTEGRATED') {
                const tRaw = (extTheoryMap[lookupKey] || extTheoryMap[student.registerNumber])?.rawExternal100 || 0;
                theoryRaw100 = isAbsent ? 'UA' : tRaw;
                theoryExt25 = isAbsent ? 'UA' : Math.round((tRaw / 100) * 25);

                const lRaw = (extLabMap[student.registerNumber] || extLabMap[lookupKey])?.rawExternal100 || 0;
                labRaw100 = isAbsent ? 'UA' : lRaw;
                labExt25 = isAbsent ? 'UA' : Math.round((lRaw / 100) * 25);
            }

            // For THEORY/LAB: raw external for display
            let rawExternal100 = null;
            if (category !== 'INTEGRATED') {
                rawExternal100 = (extMarksMap[lookupKey] || extTheoryMap[lookupKey])?.rawExternal100 || 0;
            }

            return {
                id: student.id,
                name: student.name,
                registerNumber: student.registerNumber,
                rollNo: student.rollNo,
                internal40: Math.round(internalProcessed),
                external60: isAbsent ? 'UA' : Math.round(externalProcessed),
                rawExternal100: isAbsent ? 'UA' : rawExternal100,
                theoryRaw100,
                theoryExt25,
                labRaw100,
                labExt25,
                total100: isAbsent ? 'UA' : total100,
                dummyNumber: dummyMapping.dummyNumber || student.registerNumber,
                isLocked: ciaRecord.endSemMarks?.isLocked || false,
                isPublished: ciaRecord.endSemMarks?.isPublished || false,
                grade: ciaRecord.endSemMarks?.grade || 'N/A',
                resultStatus: ciaRecord.endSemMarks?.resultStatus || 'N/A',
            };
        });

        res.json({ students: consolidated, batchStatus });
    } catch (error) {
        handleError(res, error, "Failed to get end semester marks");
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
            const isLabOnly = subjectCategory === 'LAB';

            // 1b. Check if external marks are approved (for non-LAB subjects or if enforced)
            const marksOverview = await tx.externalMark.findMany({
                where: { subjectId: subIdInt }
            });

            if (marksOverview.length === 0) {
                 throw new Error("No external marks found. Cannot generate grades.");
            }
            if (marksOverview.some(m => m.status !== 'APPROVED')) {
                 throw new Error("External marks are not yet approved by Admin. Please approve them in Results Consolidation first.");
            }

            // 2. Fetch students based on category:
            //    THEORY/INTEGRATED → must have dummyMapping (needed for absent flag & extRecord key)
            //    LAB → just need a marks record (no dummy mapping)
            const studentWhere = isLabOnly
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
            // For THEORY/LAB: key by dummyNumber. For INTEGRATED: build separate THEORY and LAB maps
            const extTheoryMap = {};
            const extLabMap = {};
            externalMarks.forEach(em => {
                if (em.component === 'LAB') {
                    // Lab components usually keyed by register number (which is stored in dummyNumber field for pure LAB subjects)
                    extLabMap[em.dummyNumber] = em;
                } else {
                    extTheoryMap[em.dummyNumber] = em;
                }
            });

            const grades = await tx.gradeSettings.findMany({ where: { regulation } });

            let count = 0;
            const skipped = [];

            for (const student of students) {
                const ciaRecord = student.marks[0];
                if (!ciaRecord) {
                    skipped.push({ studentId: student.id, name: student.name, reason: 'No CIA marks' });
                    continue;
                }

                // For THEORY/INTEGRATED: use dummyMapping for absent flag and extRecord key
                // For LAB: use registerNumber as extRecord key, no absent flag from mapping
                const dummyMapping = student.dummyMappings[0] || null;
                const isAbsent = isLabOnly ? false : (dummyMapping?.isAbsent || false);

                // Lookup key for external marks
                const extLookupKey = isLabOnly
                    ? student.registerNumber
                    : (dummyMapping?.dummyNumber || null);

                if (!isLabOnly && !dummyMapping) {
                    skipped.push({ studentId: student.id, name: student.name, reason: 'No dummy mapping' });
                    continue;
                }

                const extRecord = extLookupKey ? extTheoryMap[extLookupKey] : null;

                // If not absent and no external marks found, skip this student
                if (!isAbsent && !extRecord) continue;

                // Logging for debugging (optional, can be removed after verification)
                // console.log(`Processing student ${student.registerNumber}: isAbsent=${isAbsent}, extRecord=${!!extRecord}, existingGrade=${ciaRecord.endSemMarks?.grade}`);

                // ── Mark calculation based on subject category ──────────────────
                let internalVal = 0;
                let externalVal = 0;
                let rawExternal = 0;
                let finalGrade = 'U';
                let finalResultStatus = 'FAIL';

                if (isAbsent) {
                    finalGrade = 'UA';
                    finalResultStatus = 'UA';
                } else if (subjectCategory === 'LAB') {
                    // LAB: internal /60, external /40
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved)
                        ? ciaRecord.internal
                        : 0;
                    // Check both maps in case component was labeled differently
                    const labRec = extLabMap[extLookupKey] || extTheoryMap[extLookupKey];
                    rawExternal = labRec?.rawExternal100 || 0;
                    externalVal = Math.round((rawExternal / 100) * 40);

                    const totalMarks = Math.round(internalVal + externalVal);
                    const { passed: isExternalPass } = calcService.checkPassFail(internalVal, externalVal, 'LAB', regulation);

                    let matchedGrade = { grade: 'U', resultStatus: 'FAIL' };
                    if (isExternalPass) {
                        const gradeResult = calcService.getFixedGrade(totalMarks, grades);
                        matchedGrade = { grade: gradeResult.grade, resultStatus: 'PASS' };
                    }

                    finalResultStatus = matchedGrade.resultStatus;
                    finalGrade = matchedGrade.grade;

                } else if (subjectCategory === 'INTEGRATED') {
                    // INTEGRATED: internal is 50, External: THEORY 25 + LAB 25 = 50
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved) ? ciaRecord.internal : 0;

                    // Lookup Theory (Dummy or Reg) and Lab (Reg)
                    const theoryRec = extTheoryMap[extLookupKey] || extTheoryMap[student.registerNumber];
                    const labRec = extLabMap[student.registerNumber] || extLabMap[extLookupKey] || extTheoryMap[student.registerNumber];

                    // Scaling logic: Always scale from rawExternal100 (which is % of 100)
                    const theoryRawRaw = theoryRec?.rawExternal100 || 0;
                    const theoryRaw = Math.round((theoryRawRaw / 100) * 25);

                    const labRawRaw = labRec?.rawExternal100 || 0;
                    const labRaw = Math.round((labRawRaw / 100) * 25);

                    const theoryExt25 = theoryRaw;
                    const labExt25 = labRaw;

                    externalVal = Math.round(theoryExt25 + labExt25);
                    rawExternal = theoryExt25; // Base theory for legacy field

                    const totalMarks = Math.round(internalVal + externalVal); // max 100
                    const { passed: isPass } = calcService.checkPassFail(internalVal, externalVal, 'INTEGRATED', regulation);

                    let matchedGrade = { grade: 'U', resultStatus: 'FAIL' };
                    if (isPass) {
                        const gradeResult = calcService.getFixedGrade(totalMarks, grades);
                        matchedGrade = { grade: gradeResult.grade, resultStatus: 'PASS' };
                    }

                    finalResultStatus = matchedGrade.resultStatus;
                    finalGrade = matchedGrade.grade;

                } else {
                    // THEORY: internal 40, external 60
                    internalVal = (ciaRecord.internal && ciaRecord.isApproved) ? Math.round(ciaRecord.internal * 0.4) : 0;
                    rawExternal = extTheoryMap[extLookupKey]?.rawExternal100 || 0;
                    externalVal = Math.round((rawExternal / 100) * 60);

                    const totalMarks = Math.round(internalVal + externalVal);
                    const { passed: isExternalPass } = calcService.checkPassFail(internalVal, externalVal, 'THEORY', regulation);

                    let matchedGrade = { grade: 'U', resultStatus: 'FAIL' };
                    if (isExternalPass) {
                        const gradeResult = calcService.getFixedGrade(totalMarks, grades);
                        matchedGrade = { grade: gradeResult.grade, resultStatus: 'PASS' };
                    }

                    finalResultStatus = matchedGrade.resultStatus;
                    finalGrade = matchedGrade.grade;
                }

                const totalMarks = isAbsent ? 0 : Math.round(
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

                // ── Arrear Propagation & Automatic Generation ──────────────────
                const arrear = await tx.arrear.findUnique({
                    where: { studentId_subjectId: { studentId: student.id, subjectId: subIdInt } }
                });

                if (arrear) {
                    if (!arrear.isCleared) {
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
                            if (arrear.semester === student.semester) {
                                // If they were previously marked as FAIL in this same regular session, but now PASS (correction)
                                // We remove the arrear record as it never truly became one.
                                await tx.arrearAttempt.deleteMany({ where: { arrearId: arrear.id } });
                                await tx.arrear.delete({ where: { id: arrear.id } });
                            } else {
                                // Official arrear clearing
                                await tx.arrear.update({
                                    where: { id: arrear.id },
                                    data: { isCleared: true, clearedInSem: student.semester }
                                });
                            }
                        } else if (finalResultStatus === 'FAIL' || finalResultStatus === 'UA') {
                             // Re-fail or absenteeism: ensure arrear is active
                             await tx.arrear.update({
                                 where: { id: arrear.id },
                                 data: { isCleared: false }
                             });
                        }
                    }
                } else if (finalResultStatus === 'FAIL' || finalResultStatus === 'UA') {
                    // First time fail - Auto-generate arrear record for future tracking
                    await tx.arrear.upsert({
                        where: { studentId_subjectId: { studentId: student.id, subjectId: subIdInt } },
                        update: { isCleared: false },
                        create: {
                            studentId: student.id,
                            subjectId: subIdInt,
                            semester: student.semester,
                            attemptCount: 0,
                            isCleared: false
                        }
                    });
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
        handleError(res, error, "Failed to update end semester marks");
    }
};



// --- GPA/CGPA Engine ---


// Helper for internal calculation
const _performGPACalculation = async (studentId, semester, grades) => {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return null;

    const marks = await prisma.marks.findMany({
        where: { studentId: studentId },
        include: { subject: true, endSemMarks: true }
    });

    // Filter marks for current semester
    const currentSemMarks = marks.filter(m => m.subject.semester === parseInt(semester));

    const gpaResult = calcService.calculateGPA(currentSemMarks, grades);
    const { gpa, totalCredits, earnedCredits, semesterPass } = gpaResult;

    // CGPA calculation (all past semesters + cleared arrears)
    const clearedArrears = await prisma.arrear.findMany({
        where: { studentId: studentId, isCleared: true },
        include: { subject: true }
    });

    // Populate clearedArrears with passedGrade using a single query to prevent N+1
    if (clearedArrears.length > 0) {
        const arrearIds = clearedArrears.map(ar => ar.id);
        const allAttempts = await prisma.arrearAttempt.findMany({
            where: { arrearId: { in: arrearIds }, resultStatus: 'PASS' },
            orderBy: { id: 'desc' }
        });
        
        for (const ar of clearedArrears) {
            const attempt = allAttempts.find(a => a.arrearId === ar.id);
            ar.passedGrade = attempt ? attempt.grade : 'U';
        }
    }

    const pastMarks = marks.filter(m => m.subject.semester <= parseInt(semester));
    const cgpa = calcService.calculateCGPA(pastMarks, clearedArrears, grades);

    return {
        gpa, cgpa, totalCredits, earnedCredits,
        resultStatus: semesterPass ? "PASS" : "FAIL"
    };
};

exports.calculateGPA = async (req, res) => {
    try {
        const { studentId, semester } = req.body;
        const student = await prisma.student.findUnique({ where: { id: parseInt(studentId) } });
        if (!student) return res.status(404).json({ message: "Student not found" });

        const regulation = student.regulation || '2021';
        const grades = await prisma.gradeSettings.findMany({ where: { regulation } });
        if (grades.length === 0) {
            return res.status(400).json({ 
                message: `Grade settings not configured for regulation ${regulation}. Please set up grade thresholds in Settings → Grade Settings before calculating GPA.` 
            });
        }

        const result = await _performGPACalculation(parseInt(studentId), parseInt(semester), grades);
        if (!result) return res.status(404).json({ message: "Calculation failed" });

        await prisma.semesterResult.upsert({
            where: {
                studentId_semester: {
                    studentId: parseInt(studentId),
                    semester: parseInt(semester)
                }
            },
            update: result,
            create: {
                studentId: parseInt(studentId),
                semester: parseInt(semester),
                ...result
            }
        });

        res.json(result);
    } catch (error) {
        handleError(res, error, "Failed to calculate GPA");
    }
};

exports.calculateBulkGPA = async (req, res) => {
    try {
        const { department, semester, regulation = '2021' } = req.body;
        const semInt = parseInt(semester);
        const deptFilter = await getDeptCriteria(department);

        const students = await prisma.student.findMany({
            where: { ...deptFilter, semester: semInt, status: 'ACTIVE' }
        });

        const grades = await prisma.gradeSettings.findMany({ where: { regulation } });
        if (grades.length === 0) {
            return res.status(400).json({ 
                message: `Grade settings not configured for regulation ${regulation}` 
            });
        }

        // 🚀 OPTIMIZATION: Batch Fetch All Marks for these students
        const studentIds = students.map(s => s.id);
        const allMarks = await prisma.marks.findMany({
            where: { studentId: { in: studentIds } },
            include: { subject: true, endSemMarks: true }
        });

        const allClearedArrears = await prisma.arrear.findMany({
            where: { studentId: { in: studentIds }, isCleared: true },
            include: { subject: true }
        });

        // Batch fetch all attempts to avoid N+1 inside loop
        const arrearIds = allClearedArrears.map(ar => ar.id);
        const allAttempts = await prisma.arrearAttempt.findMany({
            where: { arrearId: { in: arrearIds }, resultStatus: 'PASS' },
            orderBy: { id: 'desc' }
        });

        let processed = 0;
        for (const student of students) {
            const studentMarks = allMarks.filter(m => m.studentId === student.id);
            const currentSemMarks = studentMarks.filter(m => m.subject.semester === semInt);
            
            const gpaResult = calcService.calculateGPA(currentSemMarks, grades);
            const { gpa, totalCredits, earnedCredits, semesterPass } = gpaResult;

            const studentArrears = allClearedArrears.filter(ar => ar.studentId === student.id);
            for (const ar of studentArrears) {
                const attempt = allAttempts.find(a => a.arrearId === ar.id);
                ar.passedGrade = attempt ? attempt.grade : 'U';
            }

            const pastMarks = studentMarks.filter(m => m.subject.semester <= semInt);
            const cgpa = calcService.calculateCGPA(pastMarks, studentArrears, grades);

            const result = {
                gpa, cgpa, totalCredits, earnedCredits,
                resultStatus: semesterPass ? "PASS" : "FAIL"
            };

            await prisma.semesterResult.upsert({
                where: { studentId_semester: { studentId: student.id, semester: semInt } },
                update: result,
                create: { studentId: student.id, semester: semInt, ...result }
            });
            processed++;
        }

        res.json({ message: `Successfully calculated GPAs for ${processed} students.` });
    } catch (error) {
        handleError(res, error, "Failed to calculate bulk GPA");
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
                semester: parseInt(semester),
                section,
                isPublished: true
            },
            orderBy: { publishedAt: 'desc' }
        });

        if (!control || !control.isPublished) {
            return res.status(403).json({ message: "Results for this semester have not been published yet." });
        }

        // 2. Fetch subject info for scaling logic
        const subject = await prisma.subject.findUnique({ where: { id: parseInt(subjectId) } });
        const category = subject?.subjectCategory || 'THEORY';

        // 3. Fetch marks (Read-only)
        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
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

        const processed = students.map(s => {
            const mark = s.marks[0];
            const esm = mark?.endSemMarks;
            
            let internalScaled = 0;
            let externalScaled = 0;
            
            if (mark && mark.isApproved) {
                if (category === 'LAB') {
                    internalScaled = mark.internal || 0;
                    externalScaled = Math.round(((esm?.externalMarks || 0) / 100) * 40);
                } else if (category === 'INTEGRATED') {
                    // Integrated stores total (internal50+ext50) and externalMarks (raw theory25)
                    // We can derive correctly scaled components from totalMarks
                    internalScaled = mark.internal || 0;
                    externalScaled = (esm?.totalMarks || internalScaled) - internalScaled;
                } else {
                    // THEORY: internal is /100 raw, converted to 40
                    internalScaled = Math.round((mark.internal || 0) * 0.4);
                    // externalMarks is /100 raw, converted to 60
                    externalScaled = Math.round(((esm?.externalMarks || 0) / 100) * 60);
                }
            }

            return {
                ...s,
                internalScaled,
                externalScaled,
                grade: esm?.grade || (esm?.resultStatus === 'UA' ? 'UA' : 'N/A')
            };
        });

        res.json(processed);
    } catch (error) {
        handleError(res, error, "Failed to get faculty results");
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
        handleError(res, error, "Failed to toggle semester control");
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

        res.json(control || {
            markEntryOpen: false,
            isPublished: false,
            isLocked: false
        });
    } catch (error) {
        handleError(res, error, "Failed to get semester control");
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
        handleError(res, error, "Failed to generate grade sheet");
    }
};

const getConsolidatedResultsData = async (department, semester, regulation) => {
    const semInt = parseInt(semester);
    const deptFilter = await getDeptCriteria(department);

    const subjects = await prisma.subject.findMany({
        where: {
            semester: semInt,
            OR: [
                deptFilter,
                { type: 'COMMON' }
            ]
        },
        orderBy: { code: 'asc' }
    });

    const deptRecord = await prisma.department.findFirst({
        where: { OR: [{ name: department }, { code: department }] }
    });

    const control = await prisma.semesterControl.findFirst({
        where: {
            department: deptRecord?.name || department,
            semester: semInt
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Try to find the actual exam session text from ExamSession table
    const examSessionRecord = await prisma.examSession.findFirst({
        where: {
            subjects: {
                some: { subjectId: { in: subjects.map(s => s.id) } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    let examSession = 'NOV/DEC ' + new Date().getFullYear();
    if (examSessionRecord) {
        if (examSessionRecord.month && examSessionRecord.year) {
            examSession = `${examSessionRecord.month.toUpperCase()} ${examSessionRecord.year}`;
        } else {
            examSession = examSessionRecord.examName.toUpperCase();
        }
    }

    const students = await prisma.student.findMany({
        where: {
            ...deptFilter,
            semester: semInt,
            status: 'ACTIVE'
        },
        include: {
            marks: {
                include: {
                    endSemMarks: true,
                    subject: true
                }
            },
            results: {
                where: { semester: semInt }
            },
            dummyMappings: true
        },
        orderBy: { rollNo: 'asc' }
    });

    // Fetch all external marks for these subjects to get the breakdown
    const externalMarks = await prisma.externalMark.findMany({
        where: {
            subjectId: { in: subjects.map(s => s.id) },
            isApproved: true
        }
    });

    const extMap = {};
    externalMarks.forEach(em => {
        if (!extMap[em.subjectId]) extMap[em.subjectId] = {};
        extMap[em.subjectId][em.dummyNumber] = em;
    });

    const studentData = students.map((student, index) => {
        const studentMarks = {};
        subjects.forEach(sub => {
            const markRecord = student.marks.find(m => m.subjectId === sub.id);
            const dummyMapping = student.dummyMappings.find(dm => dm.subjectId === sub.id);
            const dummyNo = dummyMapping?.dummyNumber;

            // Scaled component lookups
            let theoryExt = null;
            let labExt = null;

            if (sub.subjectCategory === 'INTEGRATED') {
                const theoryRec = extMap[sub.id]?.[dummyNo] || extMap[sub.id]?.[student.registerNumber];
                const labRec = extMap[sub.id]?.[student.registerNumber] || extMap[sub.id]?.[dummyNo];

                if (theoryRec) {
                    const raw = theoryRec.rawExternal100;
                    theoryExt = raw > 25 ? (raw / 100) * 25 : raw;
                }
                if (labRec && (labRec.component === 'LAB' || (theoryRec && labRec.rawExternal100 !== theoryRec.rawExternal100))) {
                    const raw = labRec.rawExternal100;
                    labExt = raw > 25 ? (raw / 100) * 25 : raw;
                }
            } else if (sub.subjectCategory === 'LAB') {
                const lookupKey = student.registerNumber;
                const lRec = extMap[sub.id]?.[lookupKey];
                labExt = lRec ? (lRec.rawExternal100 > 40 ? (lRec.rawExternal100 / 100) * 40 : lRec.rawExternal100) : null;
            } else {
                const lookupKey = dummyNo;
                const tRec = extMap[sub.id]?.[lookupKey] || extMap[sub.id]?.[student.registerNumber];
                theoryExt = tRec ? (tRec.rawExternal100 > 60 ? (tRec.rawExternal100 / 100) * 60 : tRec.rawExternal100) : null;
            }

            studentMarks[sub.code] = {
                internal: markRecord?.internal || 0,
                external: markRecord?.endSemMarks?.externalMarks || 0,
                theoryExt: theoryExt,
                labExt: labExt,
                total: markRecord?.endSemMarks?.totalMarks || 0,
                grade: markRecord?.endSemMarks?.grade || (markRecord?.endSemMarks?.resultStatus === 'UA' ? 'UA' : 'U'),
                status: markRecord?.endSemMarks?.resultStatus || 'FAIL'
            };
        });

        return {
            sno: index + 1,
            name: student.name,
            registerNumber: student.registerNumber,
            rollNo: student.rollNo,
            marks: studentMarks,
            gpa: student.results[0] ? student.results[0].gpa : null,
            cgpa: student.results[0] ? student.results[0].cgpa : null,
            earnedCredits: student.results[0] ? student.results[0].earnedCredits : null,
            resultStatus: student.results[0] ? student.results[0].resultStatus : 'PENDING'
        };
    });

    return {
        department: department,
        fullDepartmentName: deptRecord ? `${deptRecord.degree} ${deptRecord.name}` : department,
        semester: semInt,
        regulation,
        examSession,
        publishedAt: control?.publishedAt ? new Date(control.publishedAt).toLocaleDateString('en-GB').replace(/\//g, '-') : null,
        isLocked: control?.isLocked || false,
        isPublished: control?.isPublished || false,
        subjects: subjects.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            credits: s.credits,
            subjectCategory: s.subjectCategory
        })),
        students: studentData
    };
};

exports.getConsolidatedResults = async (req, res) => {
    try {
        const { department, semester, regulation = '2021' } = req.query;
        if (!department || !semester) return res.status(400).json({ message: "Params missing" });
        const data = await getConsolidatedResultsData(department, semester, regulation);
        res.json(data);
    } catch (error) {
        handleError(res, error, "Failed to get consolidated results");
    }
};

exports.exportResultsPortrait = async (req, res) => {
    try {
        const { department, semester, regulation = '2021' } = req.query;
        const data = await getConsolidatedResultsData(department, semester, regulation);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=results_portrait_${department}_sem${semester}.pdf`);
        pdfService.generateProvisionalResultsPortrait(res, data);
    } catch (error) {
        handleError(res, error, "Failed to export results portrait");
    }
};

exports.exportResultsLandscape = async (req, res) => {
    try {
        const { department, semester, regulation = '2021' } = req.query;
        const data = await getConsolidatedResultsData(department, semester, regulation);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=results_landscape_A3_${department}_sem${semester}.pdf`);
        pdfService.generateConsolidatedTabulationSheet(res, data);
    } catch (error) {
        handleError(res, error, "Failed to export results landscape");
    }
};

// ── Publish Result ─────────────────────────────────────────────────────────────

/**
 * POST /api/exam/publish
 * Publish results for a department + semester + section.
 * Sets SemesterControl.isPublished = true AND marks all
 * related EndSemMarks.isPublished = true so the faculty gate works.
 */
exports.publishResults = async (req, res) => {
    try {
        const { department, year, semester, section } = req.body;
        const publishedBy = req.user.id;

        const deptFilter = await getDeptCriteria(department);

        // Upsert the semester control record
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
            update: {
                isPublished: true,
                publishedAt: new Date(),
                publishedBy
            },
            create: {
                department: officialDept,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                isPublished: true,
                publishedAt: new Date(),
                publishedBy: parseInt(publishedBy)
            }
        });

        // Also mark all student EndSemMarks for this semester as published
        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: parseInt(semester),
                section
            },
            include: {
                marks: { 
                    include: { 
                        endSemMarks: true,
                        subject: true 
                    } 
                },
                attendance: true
            }
        });

        let updatedCount = 0;
        for (const student of students) {
            for (const mark of student.marks) {
                if (mark.endSemMarks) {
                    const subAttendance = student.attendance.filter(a => a.subjectId === mark.subjectId);
                    const total   = subAttendance.length;
                    const present = subAttendance.filter(a => a.status === 'PRESENT' || a.status === 'OD').length;
                    const percentage = total > 0 ? (present / total) * 100 : 0;

                    await prisma.endSemMarks.update({
                        where: { id: mark.endSemMarks.id },
                        data: { isPublished: true, attendanceSnapshot: percentage }
                    });
                    updatedCount++;
                }
            }

            // --- GPA/CGPA Calculation on the fly during publication ---
            try {
                const regulation = student.regulation || '2021';
                const grades = await prisma.gradeSettings.findMany({ where: { regulation } });
                
                const studentMarks = student.marks;
                const currentSemMarks = studentMarks.filter(m => m.subject.semester === parseInt(semester));
                
                const gpaResult = calcService.calculateGPA(currentSemMarks, grades);
                const { gpa, totalCredits, earnedCredits, semesterPass } = gpaResult;

                // For CGPA, we need all past marks too
                const pastMarks = studentMarks.filter(m => m.subject.semester <= parseInt(semester));
                // For simplified CGPA in this context, we'll just use the past marks we have
                const cgpaResult = calcService.calculateCGPA(pastMarks, [], grades); // Ignoring arrears for quick calc

                await prisma.semesterResult.upsert({
                    where: { studentId_semester: { studentId: student.id, semester: parseInt(semester) } },
                    update: {
                        gpa,
                        cgpa: cgpaResult,
                        totalCredits,
                        earnedCredits,
                        resultStatus: semesterPass ? "PASS" : "FAIL"
                    },
                    create: {
                        studentId: student.id,
                        semester: parseInt(semester),
                        gpa,
                        cgpa: cgpaResult,
                        totalCredits,
                        earnedCredits,
                        resultStatus: semesterPass ? "PASS" : "FAIL"
                    }
                });
            } catch (calcError) {
                logger.error(`GPA Calculation failed for student ${student.id}: ${calcError.message}`);
            }
        }

        res.json({
            success: true,
            message: `Results published for ${officialDept} Sem ${semester} Section ${section}.`,
            control,
            updatedStudentRecords: updatedCount
        });
    } catch (error) {
        handleError(res, error, "Failed to publish results");
    }
};

/**
 * POST /api/exam/unpublish
 * Unpublish results (admin only — e.g. after correction).
 */
exports.unpublishResults = async (req, res) => {
    try {
        const { department, year, semester, section } = req.body;
        const deptFilter = await getDeptCriteria(department);

        const deptDef = await prisma.department.findFirst({
            where: { OR: [{ name: department }, { code: department }] }
        });
        const officialDept = deptDef ? deptDef.name : department;

        await prisma.semesterControl.updateMany({
            where: {
                department: officialDept,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            },
            data: { isPublished: false, publishedAt: null }
        });

        // Mark student marks as unpublished
        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: parseInt(semester),
                section
            },
            include: { marks: { include: { endSemMarks: true } } }
        });

        for (const student of students) {
            for (const mark of student.marks) {
                if (mark.endSemMarks) {
                    await prisma.endSemMarks.update({
                        where: { id: mark.endSemMarks.id },
                        data: { isPublished: false }
                    });
                }
            }
        }

        res.json({
            success: true,
            message: `Results unpublished for ${officialDept} Sem ${semester} Section ${section}.`
        });
    } catch (error) {
        handleError(res, error, "Failed to unpublish results");
    }
};

/**
 * POST /api/exam/lock
 * Lock the semester to prevent any further marks updates and allow promotion
 */
exports.lockResults = async (req, res) => {
    try {
        const { department, year, semester, section } = req.body;
        const deptFilter = await getDeptCriteria(department);

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
            update: {
                isLocked: true
            },
            create: {
                department: officialDept,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                isLocked: true
            }
        });

        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: parseInt(semester),
                section
            },
            include: { marks: { include: { endSemMarks: true } } }
        });

        let updatedCount = 0;
        for (const student of students) {
            for (const mark of student.marks) {
                if (mark.endSemMarks) {
                    await prisma.endSemMarks.update({
                        where: { id: mark.endSemMarks.id },
                        data: { isLocked: true }
                    });
                    updatedCount++;
                }
            }
        }

        res.json({
            success: true,
            message: `Marks successfully locked for ${officialDept} Sem ${semester} Section ${section}. Promotions can now proceed.`,
            updatedCount
        });
    } catch (error) {
        handleError(res, error, "Failed to lock results");
    }
};

/**
 * POST /api/exam/unlock
 */
exports.unlockResults = async (req, res) => {
    try {
        const { department, year, semester, section } = req.body;
        const deptFilter = await getDeptCriteria(department);

        const deptDef = await prisma.department.findFirst({
            where: { OR: [{ name: department }, { code: department }] }
        });
        const officialDept = deptDef ? deptDef.name : department;

        await prisma.semesterControl.updateMany({
            where: {
                department: officialDept,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            },
            data: { isLocked: false }
        });

        const students = await prisma.student.findMany({
            where: {
                ...deptFilter,
                semester: parseInt(semester),
                section
            },
            include: { marks: { include: { endSemMarks: true } } }
        });

        for (const student of students) {
            for (const mark of student.marks) {
                if (mark.endSemMarks) {
                    await prisma.endSemMarks.update({
                        where: { id: mark.endSemMarks.id },
                        data: { isLocked: false }
                    });
                }
            }
        }

        res.json({
            success: true,
            message: `Marks unlocked for ${officialDept} Sem ${semester} Section ${section}.`
        });
    } catch (error) {
        handleError(res, error, "Failed to unlock results");
    }
};

/**
 * GET /api/exam/publish-status
 * Returns publish state for a given dept/year/semester/section.
 * Accessible by any authenticated user (faculty, admin, student, etc.)
 */
exports.getPublishStatus = async (req, res) => {
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

        res.json({
            isPublished: control?.isPublished || false,
            publishedAt: control?.publishedAt || null,
            isLocked: control?.isLocked || false,
            markEntryOpen: control?.markEntryOpen || false
        });
    } catch (error) {
        handleError(res, error, "Failed to get publish status");
    }
};

/**
 * GET /api/exam/student-results
 * Fetch published results for the logged-in student.
 */
exports.getStudentResults = async (req, res) => {
    try {
        const studentId = parseInt(req.user.id);
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                departmentRef: true,
                results: {
                    where: { semester: req.query.semester ? parseInt(req.query.semester) : undefined }
                },
                marks: {
                    include: {
                        subject: true,
                        endSemMarks: true
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // Fetch publication date from SemesterControl
        const control = await prisma.semesterControl.findFirst({
            where: {
                OR: [
                    { department: student.department },
                    { department: student.departmentRef?.name },
                    { department: student.departmentRef?.code }
                ].filter(i => i.department),
                semester: student.semester,
                section: student.section,
                isPublished: true
            },
            orderBy: { publishedAt: 'desc' }
        });

        // Filter for published marks and format
        const results = student.marks
            .filter(m => m.endSemMarks && (m.endSemMarks.isPublished || req.user.role === 'ADMIN'))
            .map(m => ({
                subjectCode: m.subject.code,
                subjectName: m.subject.name,
                cia: Math.round(m.internal || 0),
                external: Math.round(m.endSemMarks.externalMarks || 0),
                total: Math.round(m.endSemMarks.totalMarks || 0),
                grade: m.endSemMarks.grade,
                result: m.endSemMarks.resultStatus,
                attendanceSnapshot: m.endSemMarks.attendanceSnapshot
            }));

        // Latest result for CGPA, specific for GPA
        const gpaRecord = student.results.find(r => r.semester === student.semester) || student.results[0];

        res.json({
            isPublished: results.length > 0,
            semester: student.semester,
            publishedAt: control?.publishedAt || null,
            results,
            gpa: gpaRecord?.gpa?.toFixed(2) || '0.00',
            cgpa: gpaRecord?.cgpa?.toFixed(2) || '0.00'
        });

    } catch (error) {
        handleError(res, error, "Failed to get student results");
    }
};

// ─── One-time Global Grade Recalculation ─────────────────────────────────────
exports.recalculateAllGrades = async (req, res) => {
    try {
        const { semester, department, regulation = '2021' } = req.body;
        
        // 1. Fetch subjects
        const deptFilter = await getDeptCriteria(department);
        const subjects = await prisma.subject.findMany({
            where: { semester: parseInt(semester), ...deptFilter }
        });

        let totalProcessed = 0;

        for (const sub of subjects) {
             req.body.subjectId = sub.id;
             // Temporarily redirect response to a dummy
             const mockRes = { json: () => {}, status: () => ({ json: () => {} }) };
             await exports.updateEndSemMarks(req, mockRes);
             totalProcessed++;
        }

        res.json({ message: `Recalculation complete for ${totalProcessed} subjects.` });
    } catch (error) {
        handleError(res, error, "Failed to recalculate all grades");
    }
};

exports.getStudentResultsAdmin = async (req, res) => {
    try {
        const { regNo, semester } = req.query;
        if (!regNo) return res.status(400).json({ message: "Register Number required" });

        const student = await prisma.student.findUnique({
            where: { registerNumber: regNo },
            include: {
                departmentRef: true,
                results: {
                    where: { semester: semester ? parseInt(semester) : undefined },
                    orderBy: { semester: 'desc' },
                },
                marks: {
                    include: {
                        subject: true,
                        endSemMarks: true
                    }
                }
            }
        });

        if (!student) return res.status(404).json({ message: 'Student not found.' });

        // Format the results dynamically if required, or let the frontend handle it
        const control = await prisma.semesterControl.findFirst({
            where: {
                department: student.department,
                semester: semester ? parseInt(semester) : student.semester,
                isPublished: true
            },
            orderBy: { publishedAt: 'desc' }
        });

        const results = student.marks
            .filter(m => m.endSemMarks && (m.endSemMarks.isPublished || req.user.role === 'ADMIN'))
            .map(m => ({
                subjectCode: m.subject.code,
                subjectName: m.subject.name,
                cia: Math.round(m.internal || 0),
                external: Math.round(m.endSemMarks.externalMarks || 0),
                total: Math.round(m.endSemMarks.totalMarks || 0),
                grade: m.endSemMarks.grade,
                result: m.endSemMarks.resultStatus,
                attendanceSnapshot: m.endSemMarks.attendanceSnapshot
            }));

        const gpaRecord = student.results.find(r => r.semester === (semester ? parseInt(semester) : student.semester)) || student.results[0];

        res.json({
            studentDetails: { name: student.name, rollNo: student.rollNo, registerNumber: student.registerNumber, department: student.department },
            isPublished: results.length > 0,
            semester: semester ? parseInt(semester) : student.semester,
            publishedAt: control?.publishedAt || null,
            results,
            gpa: gpaRecord?.gpa?.toFixed(2) || '0.00',
            cgpa: gpaRecord?.cgpa?.toFixed(2) || '0.00'
        });
    } catch (error) {
        handleError(res, error, "Failed to get student results");
    }
};
