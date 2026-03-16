const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculates Internal/CIA marks based on best-of-two policy.
 * @param {Object} currentMarks - The current marks record from database.
 * @param {Object} updates - The new field updates from request.
 * @returns {Object} - Object containing calculated internal marks and flags for approved fields.
 */
// Helper to check if a CIA is "Absent" (any component is -1)
const isAbsent = (test, assign, att) => (test === -1 || assign === -1 || att === -1);

const calculateCIAlo = (test, assign, att) => {
    // Treat -1 as 0 for sum but keep track of absence
    const t = (test === -1 || test === null) ? 0 : test;
    const as = (assign === -1 || assign === null) ? 0 : assign;
    const at = (att === -1 || att === null) ? 0 : att;
    return t + as + at;
};

const calculateInternalMarks = (currentMarks, updates, subjectCategory = 'THEORY') => {
    const merged = { ...currentMarks, ...updates };
    const keys = Object.keys(updates);

    if (subjectCategory === 'LAB') {
        // LAB Categories: Attendance (5), Observation (10), Record (10), Model (75)
        const t = (merged.lab_attendance === -1 || merged.lab_attendance === null) ? 0 : merged.lab_attendance;
        const o = (merged.lab_observation === -1 || merged.lab_observation === null) ? 0 : merged.lab_observation;
        const r = (merged.lab_record === -1 || merged.lab_record === null) ? 0 : merged.lab_record;
        const m = (merged.lab_model === -1 || merged.lab_model === null) ? 0 : merged.lab_model;

        const raw100 = t + o + r + m;
        const internal = Math.round((raw100 / 100) * 60);

        return {
            internal,
            isApproved_cia1: currentMarks?.isApproved_cia1,
            isApproved_cia2: currentMarks?.isApproved_cia2,
            isApproved_cia3: currentMarks?.isApproved_cia3
        };
    }

    if (subjectCategory === 'INTEGRATED') {
        // INTEGRATED: Theory CIAs (best of 2 converted to 25) + Lab (25)
        // 1. Calculate theory internal using standard logic (Scale /100 -> /25)
        const cia1Total = calculateCIAlo(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance);
        const cia2Total = calculateCIAlo(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance);
        const cia3Total = calculateCIAlo(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance);

        const totalsSorted = [cia1Total, cia2Total, cia3Total].sort((a, b) => b - a);
        const theoryRaw = totalsSorted.length >= 2 ? (totalsSorted[0] + totalsSorted[1]) / 2 : (totalsSorted[0] || 0);
        const theory25 = (theoryRaw / 100) * 25;

        // 2. Lab Portion (Total /100 scaled to /25)
        // Components: Attendance (25), Observation (25), Record (25), Model (25) -> Total 100
        const la = (merged.lab_attendance === -1 || merged.lab_attendance === null) ? 0 : merged.lab_attendance;
        const lo = (merged.lab_observation === -1 || merged.lab_observation === null) ? 0 : merged.lab_observation;
        const lr = (merged.lab_record === -1 || merged.lab_record === null) ? 0 : merged.lab_record;
        const lm = (merged.lab_model === -1 || merged.lab_model === null) ? 0 : merged.lab_model;

        const labRaw100 = la + lo + lr + lm;
        const lab25 = (labRaw100 / 100) * 25;

        const internal = Math.round(theory25 + lab25);

        return {
            internal,
            isApproved_cia1: keys.some(k => ['cia1_test', 'cia1_assignment', 'cia1_attendance'].includes(k)) ? false : currentMarks?.isApproved_cia1,
            isApproved_cia2: keys.some(k => ['cia2_test', 'cia2_assignment', 'cia2_attendance'].includes(k)) ? false : currentMarks?.isApproved_cia2,
            isApproved_cia3: keys.some(k => ['cia3_test', 'cia3_assignment', 'cia3_attendance'].includes(k)) ? false : currentMarks?.isApproved_cia3
        };
    }

    // DEFAULT: THEORY (Best of 2 / 100)
    const cia1Total = calculateCIAlo(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance);
    const cia2Total = calculateCIAlo(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance);
    const cia3Total = calculateCIAlo(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance);

    const availableTotals = [cia1Total, cia2Total, cia3Total].sort((a, b) => b - a);
    let internal = 0;
    if (availableTotals.length >= 2) {
        internal = (availableTotals[0] + availableTotals[1]) / 2;
    } else if (availableTotals.length === 1) {
        internal = availableTotals[0];
    }

    const cia1Fields = ['cia1_test', 'cia1_assignment', 'cia1_attendance'];
    const cia2Fields = ['cia2_test', 'cia2_assignment', 'cia2_attendance'];
    const cia3Fields = ['cia3_test', 'cia3_assignment', 'cia3_attendance'];

    return {
        internal,
        isApproved_cia1: keys.some(k => cia1Fields.includes(k)) ? false : currentMarks?.isApproved_cia1,
        isApproved_cia2: keys.some(k => cia2Fields.includes(k)) ? false : currentMarks?.isApproved_cia2,
        isApproved_cia3: keys.some(k => cia3Fields.includes(k)) ? false : currentMarks?.isApproved_cia3
    };
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
    const labFields = ['lab_attendance', 'lab_observation', 'lab_record', 'lab_model', 'lab_assessment'];

    const touchingCia1 = updatedFields.some(k => cia1Fields.includes(k));
    const touchingCia2 = updatedFields.some(k => cia2Fields.includes(k));
    const touchingCia3 = updatedFields.some(k => cia3Fields.includes(k));
    const touchingLabOnly = updatedFields.every(k => labFields.includes(k));

    if (currentMark) {
        // ✅ FIX Bug #8: Global lock always blocks editing — even for lab-only fields
        if (currentMark.isLocked) return "Marks are globally locked by Admin. Contact admin to unlock.";

        // Lab-only updates skip CIA-specific lock checks (but global lock above still applies)
        if (touchingLabOnly) return null;

        if (touchingCia1 && currentMark.isLocked_cia1) return "CIA 1 marks are locked by Admin.";
        if (touchingCia2 && currentMark.isLocked_cia2) return "CIA 2 marks are locked by Admin.";
        if (touchingCia3 && currentMark.isLocked_cia3) return "CIA 3 marks are locked by Admin.";
    }

    return null;
};

const MARKS_LIMITS = {
  cia1_test: 60, cia1_assignment: 20, cia1_attendance: 20,
  cia2_test: 60, cia2_assignment: 20, cia2_attendance: 20,
  cia3_test: 60, cia3_assignment: 20, cia3_attendance: 20,
  lab_attendance: 25, lab_observation: 25, lab_record: 25, lab_model: 25,
  lab_assessment: 25
};

const validateMarksRange = (marksData) => {
  const errors = [];
  for (const [field, value] of Object.entries(marksData)) {
    if (MARKS_LIMITS[field] !== undefined && value !== null && value !== undefined) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > MARKS_LIMITS[field]) {
        errors.push(`${field} must be between 0 and ${MARKS_LIMITS[field]}`);
      }
    }
  }
  return errors;
};

module.exports = {
    calculateInternalMarks,
    checkLockStatus,
    validateMarksRange
};
