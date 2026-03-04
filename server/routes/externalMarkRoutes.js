const express = require('express');
const router = express.Router();
const externalMarkController = require('../controllers/externalMarkController');
const { verifyToken, isExternalStaff, isAdmin } = require('../middleware/authMiddleware');

router.get('/assignment/:assignmentId', verifyToken, isExternalStaff, externalMarkController.getAssignedDummyList);
router.post('/submit', verifyToken, isExternalStaff, externalMarkController.submitMarks);
// PDF generation — accessible by admin (can also be called by external staff after submit)
router.get('/statement-pdf', verifyToken, externalMarkController.generateStatementPDF);

module.exports = router;

