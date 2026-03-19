const express = require('express');
const router = express.Router();
const { 
    getPrincipalDashboard, 
    getHODDashboard, 
    getFacultyDashboard,
    getStudentDashboard,
    getChiefSecretaryDashboard
} = require('../controllers/dashboardController');
const { 
    verifyToken, 
    isPrincipal, 
    isHod, 
    isFaculty,
    isStudent,
    isChiefSecretary 
} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/principal', isPrincipal, getPrincipalDashboard);
router.get('/hod', isHod, getHODDashboard);
router.get('/faculty', isFaculty, getFacultyDashboard);
router.get('/student', isStudent, getStudentDashboard);
router.get('/chief-secretary', isChiefSecretary, getChiefSecretaryDashboard);

module.exports = router;
