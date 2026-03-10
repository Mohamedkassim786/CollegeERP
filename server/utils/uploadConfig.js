const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const defaultUploadDir = path.join(__dirname, '..', 'uploads', 'students');
if (!fs.existsSync(defaultUploadDir)) {
    fs.mkdirSync(defaultUploadDir, { recursive: true });
}

// Multer storage configuration for saving files exactly as {rollNo}.[ext]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, defaultUploadDir);
    },
    filename: (req, file, cb) => {
        const rollNo = req.body.rollNo ? String(req.body.rollNo).trim().toUpperCase() : 'UNKNOWN';
        const activeExt = path.extname(file.originalname).toLowerCase();
        
        // Save as {RollNo}.jpg  / png etc
        cb(null, `${rollNo}${activeExt}`);
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

module.exports = { upload, defaultUploadDir };
