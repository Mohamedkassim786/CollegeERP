/**
 * helpers.js
 * Frontend utility/helper functions.
 * Used across components for formatting, validation, and calculations.
 */

import { ATTENDANCE_THRESHOLDS, ELIGIBILITY_STATUS, GRADE_POINTS } from './constants';

/**
 * Format a date string or Date to DD/MM/YYYY.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

/**
 * Format a date to DDMMYYYY (default student password format).
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateDDMMYYYY = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}${month}${year}`;
};

/**
 * Format a Date to a readable datetime string for UI display.
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

/**
 * Calculate attendance percentage (rounded to 2 decimal places).
 * @param {number} present
 * @param {number} total
 * @returns {number}
 */
export const calcAttendancePercent = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100 * 100) / 100;
};

/**
 * Get the eligibility status label and colour class based on attendance %.
 * @param {number} percent
 * @returns {{ status: string, label: string, colorClass: string }}
 */
export const getEligibilityStatus = (percent) => {
    if (percent >= ATTENDANCE_THRESHOLDS.ELIGIBLE) {
        return {
            status: ELIGIBILITY_STATUS.ELIGIBLE,
            label: 'Eligible',
            colorClass: 'text-green-700 bg-green-50 border-green-200',
        };
    }
    if (percent >= ATTENDANCE_THRESHOLDS.CONDONATION_MIN) {
        return {
            status: ELIGIBILITY_STATUS.CONDONATION,
            label: 'Condonation',
            colorClass: 'text-orange-700 bg-orange-50 border-orange-200',
        };
    }
    return {
        status: ELIGIBILITY_STATUS.DETAINED,
        label: 'Detained (SA)',
        colorClass: 'text-red-700 bg-red-50 border-red-200',
    };
};

/**
 * Get letter grade from total percentage (fixed grade table — ≤30 students).
 * @param {number} percent
 * @returns {string}
 */
export const getGrade = (percent) => {
    if (percent >= 91) return 'O';
    if (percent >= 81) return 'A+';
    if (percent >= 71) return 'A';
    if (percent >= 61) return 'B+';
    if (percent >= 56) return 'B';
    if (percent >= 50) return 'C';
    return 'U';
};

/**
 * Get grade point for a letter grade.
 * @param {string} grade
 * @returns {number}
 */
export const getGradePoint = (grade) => GRADE_POINTS[grade] ?? 0;

/**
 * Calculate GPA from an array of subject results.
 * @param {Array<{credits: number, gradePoints: number}>} subjects
 * @returns {number}
 */
export const calcGPA = (subjects) => {
    const totalCredits   = subjects.reduce((sum, s) => sum + s.credits, 0);
    const weightedPoints = subjects.reduce((sum, s) => sum + (s.credits * s.gradePoints), 0);
    if (!totalCredits) return 0;
    return Math.round((weightedPoints / totalCredits) * 100) / 100;
};

/**
 * Degree classification based on CGPA.
 * @param {number} cgpa
 * @param {boolean} isFirstAttempt - All 8 sems in first attempt
 * @param {boolean} hasNoSA - No SA in any semester
 * @returns {string}
 */
export const classifyDegree = (cgpa, isFirstAttempt = false, hasNoSA = false) => {
    if (cgpa >= 8.50 && isFirstAttempt && hasNoSA) return 'First Class with Distinction';
    if (cgpa >= 6.50) return 'First Class';
    return 'Second Class';
};

/**
 * Convert semester number to year label.
 * @param {number} semester
 * @returns {string}
 */
export const semesterToYear = (semester) => {
    const year = Math.ceil(semester / 2);
    const labels = ['', '1st Year', '2nd Year', '3rd Year', '4th Year'];
    return labels[year] || `Year ${year}`;
};

/**
 * Safely get a nested object value without throwing.
 * @param {object} obj
 * @param {string} path - dot-separated path, e.g. 'student.name'
 * @param {any} fallback
 * @returns {any}
 */
export const get = (obj, path, fallback = undefined) => {
    return path.split('.').reduce((acc, key) =>
        acc?.[key], obj) ?? fallback;
};

/**
 * Truncate text to a max length, appending '...' if needed.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export const truncate = (str, max = 50) => {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
};

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export const capitalise = (str = '') =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/**
 * Format a role string for display (e.g. 'CHIEF_SECRETARY' → 'Chief Secretary').
 * @param {string} role
 * @returns {string}
 */
export const formatRole = (role = '') =>
    role.split('_').map(capitalise).join(' ');

/**
 * Download a blob as a file.
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};
