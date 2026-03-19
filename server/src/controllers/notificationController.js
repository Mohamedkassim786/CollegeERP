/**
 * notificationController.js
 * Handles HOD notification CRUD operations.
 * Notifications are created automatically by the attendance cron job.
 */

const prisma = require('../lib/prisma');
const { logger } = require('../utils/logger');
const { handleError } = require('../utils/errorUtils');

/**
 * GET /api/notifications
 * Returns unread + recent notifications for the logged-in HOD.
 */
exports.getNotifications = async (req, res) => {
    try {
        const hodId = req.user.id;

        const notifications = await prisma.notification.findMany({
            where: { hodId },
            include: {
                faculty: {
                    select: { id: true, fullName: true, department: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50 // Return last 50
        });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.json({ notifications, unreadCount });
    } catch (error) {
        handleError(res, error, "Failed to get notifications");
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });

        res.json({ message: 'Marked as read.' });
    } catch (error) {
        handleError(res, error, "Failed to mark notification as read");
    }
};

/**
 * PATCH /api/notifications/mark-all-read
 * Marks all HOD's notifications as read.
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const hodId = req.user.id;

        await prisma.notification.updateMany({
            where: { hodId, isRead: false },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications marked as read.' });
    } catch (error) {
        handleError(res, error, "Failed to mark all notifications as read");
    }
};

/**
 * DELETE /api/notifications/clear-old
 * Deletes notifications older than 30 days.
 * Called by admin or automatically by a scheduled job.
 */
exports.clearOld = async (req, res) => {
    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);

        const { count } = await prisma.notification.deleteMany({
            where: { createdAt: { lt: cutoff } }
        });

        res.json({ message: `Cleared ${count} old notifications.` });
    } catch (error) {
        handleError(res, error, "Failed to clear old notifications");
    }
};
