const express = require('express');
const router = express.Router();
const { 
    getPrincipalDashboard, 
    getCOEDashboard, 
    getHODDashboard, 
    getStudentDashboard,
    getChiefSecretaryDashboard
} = require('../controllers/dashboardController');
const { 
    verifyToken, 
    isPrincipal, 
    isCOE, 
    isHod, 
    isStudent,
    isChiefSecretary 
} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/principal', isPrincipal, getPrincipalDashboard);
router.get('/coe', isCOE, getCOEDashboard);
router.get('/hod', isHod, getHODDashboard);
router.get('/student', isStudent, getStudentDashboard);
router.get('/chief-secretary', isChiefSecretary, getChiefSecretaryDashboard);

module.exports = router;
