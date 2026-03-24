const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');
const { defaultUploadDir } = require('./uploadConfig');

/**
 * Extracts a ZIP buffer directly to the specified or default uploads directory,
 * parsing ONLY allowed image types (jpg, jpeg, png) under 2MB.
 */
const extractPhotosFromZip = async (zipBuffer, targetDir = defaultUploadDir) => {
    return new Promise((resolve, reject) => {
        let extractedCount = 0;
        let errors = [];

        try {
            unzipper.Open.buffer(zipBuffer)
                .then(async (directory) => {
                    for (const file of directory.files) {
                        const ext = path.extname(file.path).toLowerCase();
                        const allowedExtensions = ['.jpg', '.jpeg', '.png'];
                        
                        // Ignore directories or hidden files (like __MACOSX)
                        if (file.type !== 'File' || file.path.includes('__MACOSX/')) {
                            continue;
                        }

                        // Validate Extension
                        if (!allowedExtensions.includes(ext)) {
                            console.warn(`[ZIP] Skipping invalid file extension: ${file.path}`);
                            continue;
                        }

                        // Validate Size (Limit 2MB)
                        if (file.uncompressedSize > 2 * 1024 * 1024) {
                            errors.push(`File ${file.path} exceeds 2MB limit.`);
                            continue;
                        }

                        // Flatten everything and rename strictly based on original basename
                        // We rely entirely on the exact filename inside the zip (e.g., E1225001.jpg)
                        // Strict filename validation to prevent path traversal
                        const fileName = path.basename(file.path);
                        if (!/^[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png)$/i.test(fileName)) {
                            console.warn(`[ZIP] Skipping suspicious filename: ${fileName}`);
                            continue;
                        }
                        const destPath = path.join(targetDir, fileName);

                        await new Promise((resolveWrite, rejectWrite) => {
                            file.stream()
                                .pipe(fs.createWriteStream(destPath))
                                .on('error', rejectWrite)
                                .on('finish', () => {
                                    extractedCount++;
                                    resolveWrite();
                                });
                        });
                    }

                    resolve({ count: extractedCount, errors });
                })
                .catch(reject);
        } catch (globalError) {
            reject(globalError);
        }
    });
};

module.exports = { extractPhotosFromZip };
