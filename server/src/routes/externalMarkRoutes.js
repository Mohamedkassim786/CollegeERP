const express = require('express');
const router = express.Router();
const externalMarkController = require('../controllers/externalMarkController');
const { verifyToken, isExternal, isAdmin } = require('../middleware/authMiddleware');
const { validateZod, markEntrySchema } = require('../middleware/zodValidation');

router.get('/assignment/:assignmentId', verifyToken, isExternal, externalMarkController.getAssignedDummyList);
router.post('/submit', verifyToken, isExternal, validateZod(markEntrySchema), externalMarkController.submitMarks);
// Admin direct external mark entry (bypasses staff assignment flow)
router.post('/submit-admin', verifyToken, isAdmin, validateZod(markEntrySchema), externalMarkController.submitMarksAdmin);
// PDF generation — accessible by admin (can also be called by external staff after submit)
router.get('/statement-pdf', verifyToken, externalMarkController.generateStatementPDF);

// Approval workflow
router.post('/approve', verifyToken, isAdmin, externalMarkController.approveExternalMarks);
router.post('/reject', verifyToken, isAdmin, externalMarkController.rejectExternalMarks);

module.exports = router;

