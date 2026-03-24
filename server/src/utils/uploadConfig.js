const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadBase = path.join(__dirname, '..', '..', 'uploads');
const studentDir = path.join(uploadBase, 'students');
const facultyDir = path.join(uploadBase, 'faculty');

[studentDir, facultyDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const defaultUploadDir = studentDir;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.originalUrl.includes('/faculty')) {
            cb(null, facultyDir);
        } else {
            cb(null, studentDir);
        }
    },
    filename: (req, file, cb) => {
        const id = (req.body.rollNo || req.body.staffId || 'UNKNOWN').trim().toUpperCase();
        const activeExt = path.extname(file.originalname).toLowerCase();
        cb(null, `${id}${activeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB restriction
});

module.exports = { upload, defaultUploadDir, studentDir, facultyDir };
