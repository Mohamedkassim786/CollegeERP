const express = require('express');
const router = express.Router();
const externalMarkController = require('../controllers/externalMarkController');
const { verifyToken, isExternal, isAdmin } = require('../middleware/authMiddleware');

router.get('/assignment/:assignmentId', verifyToken, isExternal, externalMarkController.getAssignedDummyList);
router.post('/submit', verifyToken, isExternal, externalMarkController.submitMarks);
// Admin direct external mark entry (bypasses staff assignment flow)
router.post('/submit-admin', verifyToken, isAdmin, externalMarkController.submitMarksAdmin);
// PDF generation — accessible by admin (can also be called by external staff after submit)
router.get('/statement-pdf', verifyToken, externalMarkController.generateStatementPDF);

module.exports = router;

