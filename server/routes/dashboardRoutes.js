const express = require('express');
const router = express.Router();
const { 
    getPrincipalDashboard, 
    getCOEDashboard, 
    getHODDashboard, 
    getStudentDashboard 
} = require('../controllers/dashboardController');
const { 
    verifyToken, 
    isPrincipal, 
    isCOE, 
    isHod, 
    isStudent 
} = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/principal', isPrincipal, getPrincipalDashboard);
router.get('/coe', isCOE, getCOEDashboard);
router.get('/hod', isHod, getHODDashboard);
router.get('/student', isStudent, getStudentDashboard);

module.exports = router;
