const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    getProfile,
    updateProfile,
    getAllFaculty,
    resetFacultyPassword,
    toggleFacultyStatus,
    getActivityLogs
} = require('../controllers/profileController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const router = express.Router();

// Multer — upload faculty/staff photos to uploads/photos/
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../../uploads/photos');
        require('fs').mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// Common Profile Routes
router.get('/me', verifyToken, getProfile);      // Alias for FacultyProfile.jsx
router.get('/', verifyToken, getProfile);
router.put('/', verifyToken, updateProfile);
router.patch('/update', verifyToken, updateProfile);  // PATCH alias

// Photo Upload
router.post('/upload-photo', verifyToken, upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    try {
        await prisma.user.update({ where: { id: req.user.id }, data: { photoUrl } });
        res.json({ message: 'Photo updated.', photoUrl });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Only - Faculty Management
router.get('/faculty', verifyToken, isAdmin, getAllFaculty);
router.post('/faculty/reset-password', verifyToken, isAdmin, resetFacultyPassword);
router.post('/faculty/toggle-status', verifyToken, isAdmin, toggleFacultyStatus);
router.get('/activity-logs', verifyToken, isAdmin, getActivityLogs);

module.exports = router;
