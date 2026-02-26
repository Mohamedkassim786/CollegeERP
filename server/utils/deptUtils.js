const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Gets a robust department filter for Prisma queries.
 * Handles Name, Code, and First Year (General) aliases.
 * @param {string} deptString - The department name or code from input.
 * @returns {Promise<object>} - A Prisma filter object for the 'department' field.
 */
const getDeptCriteria = async (deptString) => {
    if (!deptString) {
        return {
            OR: [
                { department: null },
                { department: '' },
                { department: 'First Year (General)' },
                { department: 'GEN' }
            ]
        };
    }

    const trimmed = deptString.trim();
    if (trimmed === 'GEN' || trimmed === 'First Year (General)') {
        return {
            OR: [
                { department: 'First Year (General)' },
                { department: 'GEN' },
                { department: null },
                { department: '' }
            ]
        };
    }

    const deptDef = await prisma.department.findFirst({
        where: { OR: [{ name: trimmed }, { code: trimmed }] }
    });

    if (deptDef) {
        const criteria = [deptDef.name, deptDef.code].filter(Boolean).map(s => s.trim());
        return { department: { in: criteria } };
    }

    return { department: trimmed };
};

module.exports = { getDeptCriteria };
