/**
 * helpers.js
 * Reusable utility/helper functions shared across controllers and services.
 * No business logic here — only pure functions.
 */

/**
 * Format a Date object to DD/MM/YYYY string.
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format a Date object to DDMMYYYY (used as default student password).
 * @param {Date|string} date
 * @returns {string}
 */
const formatDateDDMMYYYY = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}${month}${year}`;
};

/**
 * Calculate attendance percentage.
 * @param {number} present - Classes attended
 * @param {number} total - Total classes held
 * @returns {number} Percentage rounded to 2 decimal places (0–100)
 */
const calcAttendancePercent = (present, total) => {
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100 * 100) / 100;
};

/**
 * Safely parse an integer, returning null if not a valid number.
 * @param {any} value
 * @returns {number|null}
 */
const safeInt = (value) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
};

/**
 * Safely parse a float, returning null if not a valid number.
 * @param {any} value
 * @returns {number|null}
 */
const safeFloat = (value) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
};

/**
 * Clamp a numeric value between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Chunk an array into groups of a given size.
 * Useful for paginated DB queries and PDF generation (e.g. 50 students per page).
 * @param {Array} array
 * @param {number} size
 * @returns {Array[]}
 */
const chunk = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

/**
 * Extract pagination params from an Express request query.
 * @param {import('express').Request} req
 * @param {number} defaultLimit
 * @returns {{ page: number, limit: number, skip: number }}
 */
const getPagination = (req, defaultLimit = 50) => {
    const page  = Math.max(1, safeInt(req.query.page)  || 1);
    const limit = Math.max(1, safeInt(req.query.limit) || defaultLimit);
    const skip  = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Convert a semester number to its academic year label.
 * Semesters 1–2 → 1st Year, 3–4 → 2nd Year, 5–6 → 3rd Year, 7–8 → 4th Year.
 * @param {number} semester
 * @returns {number} year (1–4)
 */
const semesterToYear = (semester) => Math.ceil(semester / 2);

/**
 * Normalise a string for safe comparison (lowercase + trim).
 * @param {string} str
 * @returns {string}
 */
const normalise = (str = '') => str.toString().trim().toLowerCase();

/**
 * Check whether a value is a non-empty string.
 * @param {any} value
 * @returns {boolean}
 */
const isNonEmptyString = (value) =>
    typeof value === 'string' && value.trim().length > 0;

/**
 * Build a GPA/CGPA summary object from raw marks data.
 * Moved here from individual controllers to avoid duplication.
 * @param {number} weightedPoints - Sum of (gradePoints × credits)
 * @param {number} totalCredits   - Sum of all applicable credits
 * @returns {{ gpa: number, percentage: number }}
 */
const calcGPA = (weightedPoints, totalCredits) => {
    if (!totalCredits || totalCredits === 0) return { gpa: 0, percentage: 0 };
    const gpa = Math.round((weightedPoints / totalCredits) * 100) / 100;
    const percentage = Math.round(gpa * 10 * 100) / 100;
    return { gpa, percentage };
};

module.exports = {
    formatDate,
    formatDateDDMMYYYY,
    calcAttendancePercent,
    safeInt,
    safeFloat,
    clamp,
    chunk,
    getPagination,
    semesterToYear,
    normalise,
    isNonEmptyString,
    calcGPA,
};
