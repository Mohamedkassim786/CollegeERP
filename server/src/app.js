const express = require('express');
const cors = require('cors');
const prisma = require('./lib/prisma');
const dotenv = require('dotenv');

dotenv.config();

// --- Startup Validation ---
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
}

const { logger } = require('./utils/logger');
const { notFound, globalError } = require('./middleware/error.middleware');

const app = express();

const PORT = process.env.PORT || 3000;
const compression = require('compression');

app.use(compression());

const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

const path = require('path');

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve uploaded static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic Health Check
app.get('/', (req, res) => {
    res.send('College ERP API is running');
});


const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const profileRoutes = require('./routes/profileRoutes');
const examRoutes = require('./routes/examRoutes');
const externalRoutes = require('./routes/externalRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const materialRoutes = require('./routes/materialRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Routes will be imported here
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/dummy', require('./routes/dummyRoutes'));
app.use('/api/external/marks', require('./routes/externalMarkRoutes'));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/eligibility', require('./routes/eligibilityRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api', require('./routes/examPrintRoutes'));

// ─── 404 + Global Error Handler (must be LAST) ───
app.use(notFound);
app.use(globalError);

const os = require('os');
const networkInterfaces = os.networkInterfaces();
let currentIp = 'localhost';

for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
            currentIp = iface.address;
            break;
        }
    }
    if (currentIp !== 'localhost') break;
}

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on:`);
    logger.info(`- Local:   http://localhost:${PORT}`);
    logger.info(`- Network: http://${currentIp}:${PORT}`);

    // Register HOD attendance cron job
    try {
        const { registerCronJobs } = require('./jobs/attendance.cron');
        registerCronJobs();
    } catch (e) {
        logger.error('Cron jobs could not be loaded:', e);
    }
});
