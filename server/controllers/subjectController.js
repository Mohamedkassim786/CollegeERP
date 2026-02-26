const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

const getSubjects = async (req, res) => {
    try {
        const { department } = req.query;
        let where = {};
        if (department) {
            where = {
                OR: [
                    { department: { contains: department } },
                    { type: 'COMMON' }
                ]
            };
        }
        const subjects = await prisma.subject.findMany({
            where,
            include: {
                facultyAssignments: {
                    include: {
                        faculty: true
                    }
                }
            },
            orderBy: [{ semester: 'asc' }, { code: 'asc' }]
        });

        // Map to format frontend expects
        const mappedSubjects = subjects.map(sub => ({
            ...sub,
            assignments: sub.facultyAssignments.map(fa => ({
                id: fa.id,
                section: fa.section,
                department: fa.department,
                facultyName: fa.faculty?.fullName || 'Unknown'
            }))
        }));

        res.json(mappedSubjects);
    } catch (error) {
        handleError(res, error, "Error fetching subjects");
    }
};

const createSubject = async (req, res) => {
    const { code, name, department, semester, type, credits, shortName } = req.body;
    try {
        const subject = await prisma.subject.create({
            data: {
                code,
                name,
                shortName,
                department, // Can be comma separated
                semester: parseInt(semester),
                type: type || 'DEPARTMENT',
                credits: parseInt(credits) || 3
            }
        });
        res.status(201).json(subject);
    } catch (error) {
        handleError(res, error, "Error creating subject");
    }
};

const deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const subIdInt = parseInt(id);

        // 1. Check for published results blocking deletion
        const publishedResults = await prisma.endSemMarks.findFirst({
            where: {
                marks: { subjectId: subIdInt },
                OR: [{ isPublished: true }, { isLocked: true }]
            }
        });

        if (publishedResults) {
            return res.status(403).json({
                message: 'CRITICAL: Cannot delete subject with published or locked results.'
            });
        }

        // 2. Perform Cascading Delete in Transaction
        await prisma.$transaction([
            prisma.facultyAssignment.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.timetable.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.studentAttendance.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.externalMarkAssignment.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.subjectDummyMapping.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.endSemMarks.deleteMany({ where: { marks: { subjectId: subIdInt } } }),
            prisma.marks.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.arrearAttempt.deleteMany({ where: { arrear: { subjectId: subIdInt } } }),
            prisma.arrear.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.hallAllocation.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.examSessionSubjects.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.material.deleteMany({ where: { subjectId: subIdInt } }),
            prisma.subject.delete({ where: { id: subIdInt } })
        ]);

        res.json({ message: 'Subject and all related records deleted successfully' });
    } catch (error) {
        handleError(res, error, "Failed to delete subject safely");
    }
};

const assignFaculty = async (req, res) => {
    const { facultyId, subjectId, section, department } = req.body;
    try {
        const assignment = await prisma.facultyAssignment.create({
            data: {
                facultyId: parseInt(facultyId),
                subjectId: parseInt(subjectId),
                section,
                department
            }
        });
        res.json(assignment);
    } catch (error) {
        handleError(res, error, "Error assigning faculty");
    }
};

const removeFacultyAssignment = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.facultyAssignment.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Assignment removed' });
    } catch (error) {
        handleError(res, error, "Error removing assignment");
    }
};

module.exports = {
    getSubjects,
    createSubject,
    deleteSubject,
    assignFaculty,
    removeFacultyAssignment
};
