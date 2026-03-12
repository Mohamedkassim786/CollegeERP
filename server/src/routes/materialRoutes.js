const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, isFaculty } = require('../middleware/authMiddleware');

router.post('/', verifyToken, isFaculty, materialController.uploadMaterial);
router.get('/', verifyToken, materialController.getMaterials);
router.delete('/:id', verifyToken, materialController.deleteMaterial);

module.exports = router;
