import toast from 'react-hot-toast';

/**
 * Centrally handles API errors and displays user-friendly notifications.
 */
export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
    console.error('[API Error]:', error);

    const message = error.response?.data?.message || error.message || defaultMessage;

    // Sanitize message if it contains sensitive technical details (e.g. Prisma codes)
    if (message.includes('PrismaClient') || message.includes('FOREIGN KEY')) {
        toast.error('Database connection issue or constraint violation. Please contact support.');
    } else {
        toast.error(message);
    }

    return message;
};
