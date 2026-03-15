/**
 * notificationRoutes.js
 * HOD notification endpoints.
 * All routes require verifyToken + isHod middleware.
 */

const express = require('express');
const router = express.Router();
const { verifyToken, isHod, isAdmin } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

// GET  /api/notifications         — Get HOD's notifications with unread count
router.get('/', verifyToken, isHod, ctrl.getNotifications);

// PATCH /api/notifications/mark-all-read  — Mark all as read
router.patch('/mark-all-read', verifyToken, isHod, ctrl.markAllAsRead);

// PATCH /api/notifications/:id/read       — Mark one as read
router.patch('/:id/read', verifyToken, isHod, ctrl.markAsRead);

// DELETE /api/notifications/clear-old     — Admin: clean up old records
router.delete('/clear-old', verifyToken, isAdmin, ctrl.clearOld);

module.exports = router;
