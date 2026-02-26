const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Gets a robust department filter for Prisma queries.
 * Handles Name, Code, First Year (General) aliases, and comma-separated lists.
 * @param {string} deptString - The department name(s) or code(s) from input.
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

    // Split multiple departments
    const departments = deptString.split(',').map(d => d.trim()).filter(Boolean);
    const allCriteria = [];

    for (const trimmed of departments) {
        if (trimmed === 'GEN' || trimmed === 'First Year (General)') {
            allCriteria.push('First Year (General)', 'GEN', null, '');
            continue;
        }

        const deptDef = await prisma.department.findFirst({
            where: { OR: [{ name: trimmed }, { code: trimmed }] }
        });

        if (deptDef) {
            allCriteria.push(deptDef.name.trim(), (deptDef.code || '').trim());
        } else {
            allCriteria.push(trimmed);
        }
    }

    const uniqueCriteria = [...new Set(allCriteria.filter(Boolean))];

    if (uniqueCriteria.includes(null) || uniqueCriteria.includes('')) {
        return {
            OR: [
                { department: { in: uniqueCriteria.filter(Boolean) } },
                { department: null },
                { department: '' }
            ]
        };
    }

    return { department: { in: uniqueCriteria } };
};

module.exports = { getDeptCriteria };
