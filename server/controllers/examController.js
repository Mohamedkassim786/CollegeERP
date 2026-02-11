const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const pdfService = require('../services/pdfService');

// --- End Semester Mark Entry ---

exports.getEndSemMarks = async (req, res) => {
    try {
        const { department, year, semester, section, subjectId } = req.query;

        const students = await prisma.student.findMany({
            where: {
                department,
                year: parseInt(year),
                semester: parseInt(semester),
                section
            },
            include: {
                marks: {
                    where: { subjectId: parseInt(subjectId) },
                    include: { endSemMarks: true }
                }
            }
        });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateEndSemMarks = async (req, res) => {
    try {
        const { marksData, subjectId, semester, regulation = '2021' } = req.body;

        // 1. Check if Semester is Locked
        // We need department/year/section to check control, fetching from first student in request
        if (marksData.length > 0) {
            const firstStudent = await prisma.student.findUnique({ where: { id: parseInt(marksData[0].studentId) } });
            if (firstStudent) {
                const control = await prisma.semesterControl.findUnique({
                    where: {
                        department_year_semester_section: {
                            department: firstStudent.department,
                            year: firstStudent.year,
                            semester: parseInt(semester),
                            section: firstStudent.section
                        }
                    }
                });
                if (control && (control.isLocked || control.isFrozen)) {
                    return res.status(403).json({ message: "Semester is locked or frozen. Mark entry is prohibited." });
                }
            }
        }

        const grades = await prisma.gradeSettings.findMany({ where: { regulation } });

        for (const item of marksData) {
            const { studentId, externalMarks } = item;

            const internalRecord = await prisma.marks.findUnique({
                where: {
                    studentId_subjectId: {
                        studentId: parseInt(studentId),
                        subjectId: parseInt(subjectId)
                    }
                }
            });

            if (!internalRecord) continue;

            const totalMarks = (internalRecord.internal || 0) + (externalMarks || 0);

            // Find grade based on percentage
            const percentage = totalMarks; // Assuming total is out of 100 (Internal 40/50 + External 60/50 etc)
            const matchedGrade = grades.find(g => percentage >= g.minPercentage && percentage <= g.maxPercentage)
                || { grade: 'RA', resultStatus: 'FAIL' };

            // Critical rule: Must have min external marks (e.g. 50% of external max)
            let finalResultStatus = (matchedGrade.resultStatus === 'PASS' && externalMarks >= 25) ? 'PASS' : 'FAIL';
            let finalGrade = finalResultStatus === 'PASS' ? matchedGrade.grade : 'RA';

            await prisma.endSemMarks.upsert({
                where: { marksId: internalRecord.id },
                update: {
                    externalMarks,
                    totalMarks,
                    grade: finalGrade,
                    resultStatus: finalResultStatus
                },
                create: {
                    marksId: internalRecord.id,
                    externalMarks,
                    totalMarks,
                    grade: finalGrade,
                    resultStatus: finalResultStatus
                }
            });

            // Arrear logic - Store attempt history
            if (finalResultStatus === "FAIL") {
                const arrear = await prisma.arrear.upsert({
                    where: {
                        studentId_subjectId: {
                            studentId: parseInt(studentId),
                            subjectId: parseInt(subjectId)
                        }
                    },
                    update: { isCleared: false },
                    create: {
                        studentId: parseInt(studentId),
                        subjectId: parseInt(subjectId),
                        semester: parseInt(semester),
                        isCleared: false
                    }
                });

                await prisma.arrearAttempt.create({
                    data: {
                        arrearId: arrear.id,
                        semester: parseInt(semester),
                        internalMarks: internalRecord.internal,
                        externalMarks,
                        totalMarks,
                        grade: finalGrade,
                        resultStatus: finalResultStatus
                    }
                });
            } else {
                await prisma.arrear.updateMany({
                    where: {
                        studentId: parseInt(studentId),
                        subjectId: parseInt(subjectId)
                    },
                    data: {
                        isCleared: true,
                        clearedInSem: parseInt(semester)
                    }
                });
            }
        }

        res.json({ message: "Marks updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- GPA/CGPA Engine ---

exports.calculateGPA = async (req, res) => {
    try {
        const { studentId, semester, regulation = '2021' } = req.body;

        const grades = await prisma.gradeSettings.findMany({ where: { regulation } });
        const marks = await prisma.marks.findMany({
            where: { studentId: parseInt(studentId) },
            include: { subject: true, endSemMarks: true }
        });

        // Filter marks for current semester and previous semesters for CGPA
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

        // CGPA calculation (all past semesters)
        let cumulativePoints = 0;
        let cumulativeCredits = 0;

        for (const m of marks) {
            if (m.subject.semester <= parseInt(semester)) {
                const credits = m.subject.credits || 3;
                if (m.endSemMarks && m.endSemMarks.resultStatus === 'PASS') {
                    const gradeInfo = grades.find(g => g.grade === m.endSemMarks.grade);
                    cumulativePoints += (gradeInfo ? gradeInfo.gradePoint : 0) * credits;
                    cumulativeCredits += credits;
                } else {
                    cumulativeCredits += credits;
                }
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
        const control = await prisma.semesterControl.findUnique({
            where: {
                department_year_semester_section: {
                    department,
                    year: parseInt(year),
                    semester: parseInt(semester),
                    section
                }
            }
        });

        if (!control || !control.isPublished) {
            return res.status(403).json({ message: "Results for this semester have not been published yet." });
        }

        // 2. Fetch marks (Read-only)
        const students = await prisma.student.findMany({
            where: {
                department,
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

        const control = await prisma.semesterControl.upsert({
            where: {
                department_year_semester_section: {
                    department,
                    year: parseInt(year),
                    semester: parseInt(semester),
                    section
                }
            },
            update: updateData,
            create: {
                department,
                year: parseInt(year),
                semester: parseInt(semester),
                section,
                ...updateData
            }
        });

        res.json(control);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSemesterControl = async (req, res) => {
    try {
        const { department, year, semester, section } = req.query;

        const control = await prisma.semesterControl.findUnique({
            where: {
                department_year_semester_section: {
                    department,
                    year: parseInt(year),
                    semester: parseInt(semester),
                    section
                }
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
