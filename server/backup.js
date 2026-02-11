const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');
const BACKUP_DIR = path.join(__dirname, 'prisma', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `dev-backup-${timestamp}.db`);

try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup successful: ${backupPath}`);
} catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
}
