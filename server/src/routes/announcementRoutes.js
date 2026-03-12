const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, announcementController.createAnnouncement);
router.get('/', verifyToken, announcementController.getAnnouncements);
router.delete('/:id', verifyToken, announcementController.deleteAnnouncement);

module.exports = router;
