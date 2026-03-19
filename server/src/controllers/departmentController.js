const prisma = require('../lib/prisma');
const { handleError } = require('../utils/errorUtils');

const getDepartments = async (req, res) => {
  try {
    const depts = await prisma.department.findMany();

    // Single batch queries for all departments
    const [facultyCounts, studentCounts, subjectCounts, hodData] =
      await Promise.all([
        prisma.faculty.groupBy({
          by: ['departmentId'],
          where: { isActive: true },
          _count: { id: true }
        }),
        prisma.student.groupBy({
          by: ['departmentId'],
          where: { status: 'ACTIVE' },
          _count: { id: true }
        }),
        prisma.subject.findMany({
          select: { department: true }
        }),
        prisma.faculty.findMany({
          where: { role: 'HOD', isActive: true },
          select: { departmentId: true, fullName: true }
        })
      ]);

    // Build lookup maps
    const facultyMap = {};
    facultyCounts.forEach(f => {
      if (f.departmentId) facultyMap[f.departmentId] = f._count.id;
    });

    const studentMap = {};
    studentCounts.forEach(s => {
      if (s.departmentId) studentMap[s.departmentId] = s._count.id;
    });

    // Subject count by dept string map
    const subjectMap = {};
    subjectCounts.forEach(sub => {
      if (sub.department) {
        subjectMap[sub.department] = (subjectMap[sub.department] || 0) + 1;
      }
    });

    const hodMap = {};
    hodData.forEach(h => {
      if (h.departmentId) hodMap[h.departmentId] = h.fullName;
    });

    const enriched = depts.map(dept => ({
      ...dept,
      hodName: hodMap[dept.id] || dept.hodName || 'Unassigned',
      stats: {
        faculty: facultyMap[dept.id] || 0,
        students: studentMap[dept.id] || 0,
        subjects: subjectMap[dept.code] || subjectMap[dept.name] || 0
      }
    }));

    res.json(enriched);
  } catch (error) {
    handleError(res, error, 'Error fetching departments');
  }
};

const getSections = async (req, res) => {
    try {
        const sections = await prisma.section.findMany({
            include: { 
                department: true
            }
        });
        
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
