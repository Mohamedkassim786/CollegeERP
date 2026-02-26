const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates Internal/CIA marks based on best-of-two policy.
 * @param {Object} currentMarks - The current marks record from database.
 * @param {Object} updates - The new field updates from request.
 * @returns {Object} - Object containing calculated internal marks and flags for approved fields.
 */
const calculateInternalMarks = (currentMarks, updates) => {
    const cia1Fields = ['cia1_test', 'cia1_assignment', 'cia1_attendance'];
    const cia2Fields = ['cia2_test', 'cia2_assignment', 'cia2_attendance'];
    const cia3Fields = ['cia3_test', 'cia3_assignment', 'cia3_attendance'];

    const merged = { ...currentMarks, ...updates };

    // Helper to check if a CIA is "Absent" (any component is -1)
    const isAbsent = (test, assign, att) => (test === -1 || assign === -1 || att === -1);

    const calculateCIAlo = (test, assign, att) => {
        // Treat -1 as 0 for sum but keep track of absence
        const t = (test === -1 || test === null) ? 0 : test;
        const as = (assign === -1 || assign === null) ? 0 : assign;
        const at = (att === -1 || att === null) ? 0 : att;
        return t + as + at;
    };

    const cia1Absent = isAbsent(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance);
    const cia2Absent = isAbsent(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance);
    const cia3Absent = isAbsent(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance);

    const cia1Total = calculateCIAlo(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance);
    const cia2Total = calculateCIAlo(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance);
    const cia3Total = calculateCIAlo(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance);

    // Filter out absent totals for best-of-two
    const availableTotals = [];
    if (!cia1Absent) availableTotals.push(cia1Total);
    if (!cia2Absent) availableTotals.push(cia2Total);
    if (!cia3Absent) availableTotals.push(cia3Total);

    availableTotals.sort((a, b) => b - a);

    let internal = 0;
    if (availableTotals.length >= 2) {
        internal = (availableTotals[0] + availableTotals[1]) / 2;
    } else if (availableTotals.length === 1) {
        internal = availableTotals[0];
    }

    const keys = Object.keys(updates);
    const result = {
        internal,
        isApproved_cia1: keys.some(k => cia1Fields.includes(k)) ? false : currentMarks?.isApproved_cia1,
        isApproved_cia2: keys.some(k => cia2Fields.includes(k)) ? false : currentMarks?.isApproved_cia2,
        isApproved_cia3: keys.some(k => cia3Fields.includes(k)) ? false : currentMarks?.isApproved_cia3
    };

    return result;
};

/**
 * Validates if marks are locked for a specific student and CIA component.
 * @param {number} studentId 
 * @param {Object} currentMark 
 * @param {Array} updatedFields 
 * @returns {Promise<string|null>} - Returns error message if locked, else null.
 */
const checkLockStatus = async (studentId, currentMark, updatedFields) => {
    const cia1Fields = ['cia1_test', 'cia1_assignment', 'cia1_attendance'];
    const cia2Fields = ['cia2_test', 'cia2_assignment', 'cia2_attendance'];
    const cia3Fields = ['cia3_test', 'cia3_assignment', 'cia3_attendance'];

    const touchingCia1 = updatedFields.some(k => cia1Fields.includes(k));
    const touchingCia2 = updatedFields.some(k => cia2Fields.includes(k));
    const touchingCia3 = updatedFields.some(k => cia3Fields.includes(k));

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return "Student not found";

    const semControl = await prisma.semesterControl.findFirst({
        where: {
            department: student.department || 'GEN',
            year: student.year,
            semester: student.semester,
            section: student.section
        }
    });

    if (semControl && semControl.isLocked) {
        return "Academic integrity rule: Semester is permanently locked by Administrator.";
    }

    if (currentMark) {
        if (touchingCia1 && currentMark.isLocked_cia1) return "CIA 1 marks are locked.";
        if (touchingCia2 && currentMark.isLocked_cia2) return "CIA 2 marks are locked.";
        if (touchingCia3 && currentMark.isLocked_cia3) return "CIA 3 marks are locked.";
        if (currentMark.isLocked && (touchingCia1 || touchingCia2 || touchingCia3)) return "Marks are globally locked.";
    }

    return null;
};

module.exports = {
    calculateInternalMarks,
    checkLockStatus
};
