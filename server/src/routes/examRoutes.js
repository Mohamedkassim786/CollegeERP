const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, isAdmin, isFaculty } = require('../middleware/authMiddleware');

// Results Consolidation (End Sem Marks)
router.get('/end-sem-marks', verifyToken, isAdmin, examController.getEndSemMarks);
router.post('/end-sem-marks', verifyToken, isAdmin, examController.updateEndSemMarks);

// Faculty/HOD/ADMIN can view published results
router.get('/faculty-results', verifyToken, isFaculty, examController.getFacultyResults);

// GPA / CGPA
router.post('/calculate-gpa', verifyToken, examController.calculateGPA);
router.post('/calculate-bulk-gpa', verifyToken, isAdmin, examController.calculateBulkGPA);

// Semester Control (lock/unlock mark entry, publish flag)
router.post('/semester-control', verifyToken, isAdmin, examController.toggleSemesterControl);
router.get('/semester-control', verifyToken, isAdmin, examController.getSemesterControl);

// ── Publish / Unpublish Result ──────────────────────────────────────────────
// POST /api/exam/publish   — publish results for a dept/sem/section
// POST /api/exam/unpublish — unpublish
// GET  /api/exam/publish-status — check current publish state
router.post('/publish', verifyToken, isAdmin, examController.publishResults);
router.post('/unpublish', verifyToken, isAdmin, examController.unpublishResults);
router.get('/publish-status', verifyToken, examController.getPublishStatus);

// Consolidated + Export
router.get('/consolidated-results', verifyToken, isAdmin, examController.getConsolidatedResults);
router.get('/export-portrait', verifyToken, isAdmin, examController.exportResultsPortrait);
router.get('/export-landscape', verifyToken, isAdmin, examController.exportResultsLandscape);
router.get('/grade-sheet', verifyToken, examController.getGradeSheet);

router.get('/student-results', verifyToken, examController.getStudentResults);
router.get('/student-results/admin', verifyToken, isAdmin, examController.getStudentResultsAdmin);

// Global Recalculation (Admin)
router.post('/recalculate-all-grades', verifyToken, isAdmin, examController.recalculateAllGrades);

module.exports = router;
