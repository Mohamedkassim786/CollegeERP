const express = require('express');
const router = express.Router();
const externalStaffController = require('../controllers/externalStaffController');
const { verifyToken, isAdmin, isExternalStaff } = require('../middleware/authMiddleware');

router.get('/tasks', verifyToken, isExternalStaff, externalStaffController.getAssignedTasks);
router.post('/submit-paper', verifyToken, isExternalStaff, externalStaffController.submitQuestionPaper);
router.get('/admin/tasks', verifyToken, isAdmin, externalStaffController.getAllTasksForAdmin);
router.post('/admin/assign-task', verifyToken, isAdmin, externalStaffController.assignTask);
router.post('/admin/update-status', verifyToken, isAdmin, externalStaffController.updateTaskStatus);
router.get('/admin/staff', verifyToken, isAdmin, externalStaffController.getAllExternalStaff);
router.post('/admin/staff', verifyToken, isAdmin, externalStaffController.createExternalStaff);
router.delete('/admin/staff/:id', verifyToken, isAdmin, externalStaffController.deleteExternalStaff);
router.delete('/admin/tasks/:id', verifyToken, isAdmin, externalStaffController.deleteTask);

module.exports = router;
