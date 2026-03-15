/**
 * validators.js
 * Form validation functions for frontend forms.
 * Returns an error message string if invalid, or null if valid.
 */

/**
 * Validate that a field is not empty.
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null}
 */
export const required = (value, fieldName = 'This field') => {
    if (!value || String(value).trim() === '') {
        return `${fieldName} is required.`;
    }
    return null;
};

/**
 * Validate email format.
 * @param {string} email
 * @returns {string|null}
 */
export const validateEmail = (email) => {
    if (!email) return null; // Not required by default
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? null : 'Please enter a valid email address.';
};

/**
 * Validate phone number (10-digit Indian mobile).
 * @param {string} phone
 * @returns {string|null}
 */
export const validatePhone = (phone) => {
    if (!phone) return null; // Not required by default
    const re = /^[6-9]\d{9}$/;
    return re.test(phone) ? null : 'Please enter a valid 10-digit mobile number.';
};

/**
 * Validate password strength (min 6 characters).
 * @param {string} password
 * @returns {string|null}
 */
export const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters long.';
    return null;
};

/**
 * Validate that two password fields match.
 * @param {string} password
 * @param {string} confirm
 * @returns {string|null}
 */
export const validatePasswordMatch = (password, confirm) => {
    if (password !== confirm) return 'Passwords do not match.';
    return null;
};

/**
 * Validate a mark value is within a numeric range.
 * @param {any} value
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName
 * @returns {string|null}
 */
export const validateMarkRange = (value, min, max, fieldName = 'Mark') => {
    const num = parseFloat(value);
    if (isNaN(num)) return `${fieldName} must be a number.`;
    if (num < min || num > max) return `${fieldName} must be between ${min} and ${max}.`;
    return null;
};

/**
 * Run multiple validators and return the first error, or null.
 * @param {Array<() => string|null>} validators
 * @returns {string|null}
 */
export const runValidators = (...validators) => {
    for (const v of validators) {
        const err = v();
        if (err) return err;
    }
    return null;
};
