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
            // Stats logic can be moved here too if needed
            return { ...dept, hodName };
        }));
        res.json(enriched);
    } catch (error) {
        handleError(res, error, "Error fetching departments");
    }
};

const createDepartment = async (req, res) => {
    const { name, code, hodId, sections, years } = req.body;
    try {
        const dept = await prisma.department.create({
            data: {
                name,
                code,
                hodId: hodId ? parseInt(hodId) : null,
                sections: sections || 'A,B,C',
                years: years || '2,3,4'
            }
        });
        res.status(201).json(dept);
    } catch (error) {
        handleError(res, error, "Error creating department");
    }
};

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const { name, code, hodId, sections, years } = req.body;
    try {
        const dept = await prisma.department.update({
            where: { id: parseInt(id) },
            data: {
                name,
                code,
                hodId: hodId ? parseInt(hodId) : null,
                sections,
                years
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
    createDepartment,
    updateDepartment,
    deleteDepartment
};
