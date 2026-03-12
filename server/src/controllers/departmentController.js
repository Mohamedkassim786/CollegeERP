const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

const getDepartments = async (req, res) => {
    try {
        const depts = await prisma.department.findMany();
        const enriched = await Promise.all(depts.map(async (dept) => {
            let hodName = 'Unassigned';
            if (dept.hodId) {
                const hod = await prisma.user.findUnique({
                    where: { id: dept.hodId },
                    select: { fullName: true }
                });
                if (hod) hodName = hod.fullName;
            }

            // Calculate stats
            const [facultyCount, studentCount, subjectCount] = await Promise.all([
                prisma.user.count({
                    where: {
                        role: 'FACULTY',
                        OR: [
                            { department: dept.code },
                            { department: dept.name }
                        ]
                    }
                }),
                prisma.student.count({
                    where: {
                        OR: [
                            { departmentId: dept.id },
                            { department: dept.code },
                            { department: dept.name }
                        ]
                    }
                }),
                prisma.subject.count({
                    where: {
                        OR: [
                            { department: dept.code },
                            { department: dept.name }
                        ]
                    }
                })
            ]);

            return {
                ...dept,
                hodName,
                stats: {
                    faculty: facultyCount,
                    students: studentCount,
                    subjects: subjectCount
                }
            };
        }));
        res.json(enriched);
    } catch (error) {
        handleError(res, error, "Error fetching departments");
    }
};

const getSections = async (req, res) => {
    try {
        const sections = await prisma.section.findMany({
            include: { department: true }
        });
        res.json(sections);
    } catch (error) {
        handleError(res, error, "Error fetching sections");
    }
};

const createSection = async (req, res) => {
    const { name, semester, type, departmentId, academicYearId } = req.body;
    try {
        let activeAcademicYearId = academicYearId;
        if (!activeAcademicYearId) {
            const defaultYear = await prisma.academicYear.findFirst({
                where: { isActive: true }
            });
            if (defaultYear) {
                activeAcademicYearId = defaultYear.id;
            }
        }

        const section = await prisma.section.create({
            data: {
                name,
                semester: parseInt(semester),
                type,
                departmentId: departmentId ? parseInt(departmentId) : null,
                academicYearId: activeAcademicYearId
            }
        });
        res.status(201).json(section);
    } catch (error) {
        handleError(res, error, "Error creating section");
    }
};

const ALLOWED_DEGREES = ['B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'MBA', 'MCA']

const createDepartment = async (req, res) => {
    const { name, code, hodId, sections, years, degree } = req.body;
    
    if (degree && !ALLOWED_DEGREES.includes(degree)) {
        return res.status(400).json({ error: 'Invalid degree type' });
    }

    try {
        const dept = await prisma.department.create({
            data: {
                name,
                code,
                hodId: hodId ? parseInt(hodId) : null,
                sections: sections || 'A,B,C',
                years: years || '2,3,4',
                degree: degree || 'B.E.'
            }
        });
        res.status(201).json(dept);
    } catch (error) {
        handleError(res, error, "Error creating department");
    }
};

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, code, hodId, sections, years, degree } = req.body;

    if (degree && !ALLOWED_DEGREES.includes(degree)) {
        return res.status(400).json({ error: 'Invalid degree type' });
    }

    try {
        const dept = await prisma.department.update({
            where: { id: parseInt(id) },
            data: {
                name,
                code,
                hodId: hodId ? parseInt(hodId) : null,
                sections,
                years,
                degree
            }
        });
        res.json(dept);
    } catch (error) {
        handleError(res, error, "Error updating department");
    }
};

const deleteDepartment = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.department.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Department deleted' });
    } catch (error) {
        handleError(res, error, "Error deleting department");
    }
};

module.exports = {
    getDepartments,
    getSections,
    createSection,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
