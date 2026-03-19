const prisma = require('../lib/prisma');

/**
 * Calculates Internal/CIA marks based on best-of-two policy.
 */

const isCIAAbsent = (test, assign, att) =>
  test === -1 || assign === -1 || att === -1;

const isCIAEntered = (test, assign, att) =>
  test !== null && test !== undefined &&
  assign !== null && assign !== undefined &&
  att !== null && att !== undefined;

const calculateCIAlo = (test, assign, att) => {
    const t = (test === -1 || test === null) ? 0 : test;
    const as = (assign === -1 || assign === null) ? 0 : assign;
    const at = (att === -1 || att === null) ? 0 : att;
    return t + as + at;
};

const calculateInternalMarks = (currentMarks, updates, subjectCategory = 'THEORY') => {
    const merged = { ...currentMarks, ...updates };
    const keys = Object.keys(updates);

    if (subjectCategory === 'LAB') {
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
        const cias = [
            {
                total: calculateCIAlo(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance),
                absent: isCIAAbsent(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance),
                entered: isCIAEntered(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance)
            },
            {
                total: calculateCIAlo(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance),
                absent: isCIAAbsent(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance),
                entered: isCIAEntered(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance)
            },
            {
                total: calculateCIAlo(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance),
                absent: isCIAAbsent(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance),
                entered: isCIAEntered(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance)
            }
        ];

        const validTotal = cias
            .filter(c => c.entered && !c.absent)
            .map(c => c.total)
            .sort((a, b) => b - a);

        let theoryRaw = 0;
        if (validTotal.length >= 2) {
            theoryRaw = (validTotal[0] + validTotal[1]) / 2;
        } else if (validTotal.length === 1) {
            theoryRaw = validTotal[0];
        }
        const theory25 = (theoryRaw / 100) * 25;

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
    const cias = [
        {
          total: calculateCIAlo(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance),
          absent: isCIAAbsent(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance),
          entered: isCIAEntered(merged.cia1_test, merged.cia1_assignment, merged.cia1_attendance)
        },
        {
          total: calculateCIAlo(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance),
          absent: isCIAAbsent(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance),
          entered: isCIAEntered(merged.cia2_test, merged.cia2_assignment, merged.cia2_attendance)
        },
        {
          total: calculateCIAlo(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance),
          absent: isCIAAbsent(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance),
          entered: isCIAEntered(merged.cia3_test, merged.cia3_assignment, merged.cia3_attendance)
        }
    ];

    const validCIAs = cias
        .filter(c => c.entered && !c.absent)
        .map(c => c.total)
        .sort((a, b) => b - a);

    let internal = 0;
    if (validCIAs.length >= 2) {
        internal = (validCIAs[0] + validCIAs[1]) / 2;
    } else if (validCIAs.length === 1) {
        internal = validCIAs[0];
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
        if (currentMark.isLocked) return "Marks are globally locked by Admin. Contact admin to unlock.";
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
