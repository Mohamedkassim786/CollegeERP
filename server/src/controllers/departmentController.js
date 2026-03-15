const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

const getDepartments = async (req, res) => {
    try {
        const depts = await prisma.department.findMany();
        const enriched = await Promise.all(depts.map(async (dept) => {
            let hodName = 'Unassigned';
            
            // Priority 1: Use hodId if available to find faculty record
            if (dept.id) {
                const actualHOD = await prisma.faculty.findFirst({
                    where: { 
                        departmentId: dept.id,
                        role: 'HOD' 
                    },
                    select: { fullName: true }
                });
                if (actualHOD) {
                    hodName = actualHOD.fullName;
                } else if (dept.hodId) {
                    const hodByDirectId = await prisma.faculty.findUnique({
                        where: { id: dept.hodId },
                        select: { fullName: true }
                    });
                    if (hodByDirectId) hodName = hodByDirectId.fullName;
                }
            }
            
            // Fallback to legacy string if still unassigned
            if (hodName === 'Unassigned' && dept.hodName) {
                hodName = dept.hodName;
            }

            // Calculate stats using relational integrity
            const [facultyCount, studentCount, subjectCount] = await Promise.all([
                prisma.faculty.count({
                    where: {
                        isActive: true,
                        OR: [
                            { departmentId: dept.id },
                            { department: dept.code },
                            { department: dept.name }
                        ]
                    }
                }),
                prisma.student.count({
                    where: {
                        status: 'ACTIVE',
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
            include: { 
                department: true
            }
        });
        
        // Manually count students to include legacy string-based assignments that lack sectionId
        const enriched = await Promise.all(sections.map(async (sec) => {
            const studentCount = await prisma.student.count({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { sectionId: sec.id },
                        { 
                            section: sec.name,
                            semester: sec.semester,
                            ...(sec.departmentId ? { departmentId: sec.departmentId } : {})
                        }
                    ]
                }
            });
            return {
                ...sec,
                _count: { students: studentCount }
            };
        }));
        
        res.json(enriched);
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
                academicYearId: activeAcademicYearId || 1
            }
        });
        res.status(201).json(section);
    } catch (error) {
        handleError(res, error, "Error creating section");
    }
};

const deleteSection = async (req, res) => {
    const { id } = req.params;
    try {
        const sectionId = parseInt(id);
        
        const sec = await prisma.section.findUnique({ where: { id: sectionId } });
        if (!sec) {
            return res.status(404).json({ error: "Section not found." });
        }
        
        // Check if section has students before deleting (including legacy string records)
        const studentCount = await prisma.student.count({
            where: {
                OR: [
                    { sectionId: sec.id },
                    { 
                        section: sec.name,
                        semester: sec.semester,
                        ...(sec.departmentId ? { departmentId: sec.departmentId } : {})
                    }
                ]
            }
        });

        if (studentCount > 0) {
            return res.status(400).json({ 
                error: `Cannot delete section. There are ${studentCount} students assigned to this section.` 
            });
        }

        await prisma.section.delete({
            where: { id: sectionId }
        });
        res.json({ message: 'Section deleted successfully' });
    } catch (error) {
        handleError(res, error, "Error deleting section");
    }
};

const syncSections = async (departmentId, sectionString) => {
    if (!sectionString) return;
    try {
        const sectionNames = sectionString.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
        const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true } });
        if (!activeYear) {
            console.error("Sync failed: No active academic year found.");
            return;
        }
        const academicYearId = activeYear.id;

        // For each section in the string, ensure it exists in the Section table
        // We now populate for all 8 semesters to ensure visibility in Student Manager
        for (const name of sectionNames) {
            for (let sem = 1; sem <= 8; sem++) {
                const existing = await prisma.section.findFirst({
                    where: { name, departmentId, academicYearId, semester: sem }
                });

                if (!existing) {
                    await prisma.section.create({
                        data: {
                            name,
                            semester: sem,
                            type: 'DEPARTMENT',
                            departmentId,
                            academicYearId
                        }
                    });
                }
            }
        }
    } catch (err) {
        console.error("Section sync failed:", err);
    }
};

const ALLOWED_DEGREES = ['B.E.', 'B.Tech', 'M.E.', 'M.Tech', 'MBA', 'MCA']

const createDepartment = async (req, res) => {
    const { name, code, hodId, sections, years, degree, type } = req.body;
    
    if (degree && !ALLOWED_DEGREES.includes(degree)) {
        return res.status(400).json({ error: 'Invalid degree type' });
    }

    try {
        const dept = await prisma.department.create({
            data: {
                name,
                code,
                type: type || 'Academic',
                hodId: parseInt(hodId) || null,
                sections: sections || 'A,B,C',
                years: years || '2,3,4',
                degree: degree || 'B.E.'
            }
        });
        await syncSections(dept.id, dept.sections);
        res.status(201).json(dept);
    } catch (error) {
        handleError(res, error, "Error creating department");
    }
};

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, code, hodId, sections, years, degree, type } = req.body;

    if (degree && !ALLOWED_DEGREES.includes(degree)) {
        return res.status(400).json({ error: 'Invalid degree type' });
    }

    try {
        const deptId = parseInt(id);
        const dept = await prisma.department.update({
            where: { id: deptId },
            data: {
                name,
                code,
                type: type || 'Academic',
                hodId: parseInt(hodId) || null,
                sections,
                years,
                degree
            }
        });
        await syncSections(deptId, sections);
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
    deleteSection,
    createDepartment,
    updateDepartment,
    deleteDepartment
};
