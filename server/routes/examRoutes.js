const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { verifyToken, isAdmin, isFaculty } = require('../middleware/authMiddleware');

router.get('/end-sem-marks', verifyToken, isAdmin, examController.getEndSemMarks);
router.post('/end-sem-marks', verifyToken, isAdmin, examController.updateEndSemMarks);
router.get('/faculty-results', verifyToken, isFaculty, examController.getFacultyResults);
router.post('/calculate-gpa', verifyToken, examController.calculateGPA);
router.post('/semester-control', verifyToken, isAdmin, examController.toggleSemesterControl);
router.get('/semester-control', verifyToken, isAdmin, examController.getSemesterControl);
router.get('/grade-sheet', verifyToken, examController.getGradeSheet);

module.exports = router;
