/**
 * validate.middleware.js
 * Request validation middleware using express-validator.
 * Checks the result of validation chains and returns a 422 if any field is invalid.
 *
 * Usage (in a route file):
 *   const { body } = require('express-validator');
 *   const { validate } = require('../middleware/validate.middleware');
 *
 *   router.post('/faculty',
 *     body('fullName').notEmpty().withMessage('Full name is required'),
 *     body('employeeId').notEmpty().withMessage('Employee ID is required'),
 *     validate,
 *     facultyController.createFaculty
 *   );
 */

const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Middleware that reads express-validator results and returns 422 on failure.
 * Must be placed AFTER the validation chain middlewares in the route definition.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Build a structured errors object: { fieldName: 'error message' }
        const formattedErrors = {};
        errors.array().forEach((err) => {
            if (!formattedErrors[err.path]) {
                formattedErrors[err.path] = err.msg;
            }
        });

        logger.warn(`Validation failed on ${req.method} ${req.originalUrl}`, formattedErrors);

        return res.status(422).json({
            success: false,
            message: 'Validation failed. Please check the highlighted fields.',
            errors: formattedErrors,
        });
    }

    return next();
};

module.exports = { validate };
