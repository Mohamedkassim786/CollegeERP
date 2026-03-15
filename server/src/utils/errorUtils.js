/**
 * Sanitizes and formats error messages for API responses.
 * Prevents leakage of internal database or infrastructure details.
 */
const handleError = (res, error, customMessage = 'An unexpected error occurred') => {
    console.error(`[ERROR]:`, error);

    // Prisma specific errors
    if (error.code) {
        switch (error.code) {
            case 'P2002':
                const target = error.meta?.target || '';
                return res.status(400).json({
                    message: `Conflict: A record with this unique value already exists.`
                });
            case 'P2003':
                return res.status(400).json({
                    message: "Foreign key constraint failed. This record is linked to other data."
                });
            case 'P2025':
                return res.status(404).json({
                    message: "The requested record was not found."
                });
            default:
                return res.status(500).json({
                    message: "Database operation failed. Please try again later."
                });
        }
    }

    // Standard errors
    res.status(500).json({
        message: customMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

module.exports = { handleError };
