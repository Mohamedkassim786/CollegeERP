/**
 * eligibilityRoutes.js
 * Attendance Eligibility (SA Check) endpoints.
 */

const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin, isHod } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/eligibilityController');

// GET  /api/eligibility?department=CSE&semester=4&section=A  — view eligibility grid
router.get('/', verifyToken, ctrl.getEligibility);

// POST /api/eligibility/calculate  — calc + persist to DB
router.post('/calculate', verifyToken, isAdmin, ctrl.calculateAndSave);

// POST /api/eligibility/exception  — grant/reject condonation exception
router.post('/exception', verifyToken, isAdmin, ctrl.grantException);

// POST /api/eligibility/lock  — lock the list for a semester
router.post('/lock', verifyToken, isAdmin, ctrl.lockEligibility);

module.exports = router;
