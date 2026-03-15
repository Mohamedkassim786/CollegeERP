/**
 * hallTicketRoutes.js + examSheetRoutes — combined for simplicity
 */
const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isCOE } = require('../middleware/authMiddleware');
const hallCtrl = require('../controllers/hallTicketController');
const sheetCtrl = require('../controllers/examSheetController');

// Hall Ticket
router.get('/hall-ticket/generate',   verifyToken, isAdmin, hallCtrl.generateHallTickets);
router.get('/hall-ticket/status',      verifyToken, isAdmin, hallCtrl.getHallTicketStatus);

// Exam Attendance Sheet (by hall)
router.get('/exam-sheet/generate',     verifyToken, isCOE,   sheetCtrl.generateSheet);
router.get('/exam-sheet/sessions',     verifyToken, isAdmin, sheetCtrl.getSessions);

module.exports = router;
