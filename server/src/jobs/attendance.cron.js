/**
 * attendance.cron.js
 * HOD 4:50 PM Monday–Saturday attendance alert cron job.
 *
 * Runs every weekday at 4:50 PM and checks each faculty's timetable.
 * If a faculty has a class today but hasn't submitted attendance,
 * a Notification record is created for the HOD of that department.
 *
 * This file is imported in index.js to register the cron job at startup.
 */

const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { logger } = require('../utils/logger.js');

/** Map JS getDay() → timetable day string */
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Main routine: check attendance submission status for all faculties.
 * Creates Notification records for any faculty who missed submitting.
 */
const runAttendanceCheck = async () => {
    logger.info('Running 4:50 PM attendance check...');

    try {
        const today = new Date();
        const dayName = WEEKDAYS[today.getDay()]; // e.g. 'FRIDAY'

        if (dayName === 'SUNDAY') {
            logger.info('No class on Sunday — skipping.');
            return;
        }

        // Get today's date range (00:00 to 23:59)
        const startOfDay = new Date(new Date(today).setHours(0, 0, 0, 0));
        const endOfDay   = new Date(new Date(today).setHours(23, 59, 59, 999));

        // Find all timetable entries for today
        const timetableEntries = await prisma.timetable.findMany({
            where: { day: dayName },
            include: {
                faculty: {
                    select: { id: true, fullName: true, department: true }
                }
            }
        });

        if (!timetableEntries.length) {
            logger.info(`No timetable entries for ${dayName}.`);
            return;
        }

        // Group entries by faculty
        const byFaculty = {};
        for (const entry of timetableEntries) {
            if (!entry.facultyId) continue;
            if (!byFaculty[entry.facultyId]) {
                byFaculty[entry.facultyId] = {
                    faculty: entry.faculty,
                    subjectIds: new Set()
                };
            }
            if (entry.subjectId) {
                byFaculty[entry.facultyId].subjectIds.add(entry.subjectId);
            }
        }

        let notificationsCreated = 0;

        for (const [facultyIdStr, { faculty, subjectIds }] of Object.entries(byFaculty)) {
            const facultyId = parseInt(facultyIdStr);

            // Check if attendance was submitted for any subject today
            const submitted = await prisma.studentAttendance.findFirst({
                where: {
                    facultyId: facultyId,
                    createdAt: { gte: startOfDay, lte: endOfDay }
                }
            });

            if (submitted) continue; // Faculty submitted — no alert needed

            // Find the HOD of this faculty's department
            const hod = await prisma.faculty.findFirst({
                where: {
                    role: 'HOD',
                    department: faculty.department,
                    isActive: true
                }
            });

            if (!hod) continue; // No HOD found for department

            // Avoid creating duplicate notifications for today
            const existingAlert = await prisma.notification.findFirst({
                where: {
                    hodId: hod.id,
                    facultyId,
                    createdAt: { gte: startOfDay, lte: endOfDay },
                    type: 'ATTENDANCE_MISSING'
                }
            });

            if (existingAlert) continue;

            // Create notification
            await prisma.notification.create({
                data: {
                    hodId: hod.id,
                    facultyId,
                    message: `${faculty.fullName || 'A faculty'} has not submitted attendance for ${dayName}.`,
                    type: 'ATTENDANCE_MISSING'
                }
            });

            notificationsCreated++;
            logger.warn(`Alert: ${faculty.fullName} (${faculty.department}) missed attendance on ${dayName}`);
        }

        logger.info(`Attendance check complete. ${notificationsCreated} alerts created.`);
    } catch (err) {
        logger.error('AttendanceCron failed', err);
    }
};

/**
 * Register the cron schedule.
 * Runs Mon–Sat at 4:50 PM (16:50).
 * Cron syntax: 'minute hour day-of-month month day-of-week'
 * '50 16 * * 1-6' = 16:50, Monday(1) to Saturday(6)
 */
const registerCronJobs = () => {
    cron.schedule('50 16 * * 1-6', async () => {
        await runAttendanceCheck();
    }, {
        timezone: 'Asia/Kolkata'
    });

    logger.info('HOD Attendance Cron registered — runs Mon–Sat at 4:50 PM (IST)');
};

module.exports = { registerCronJobs, runAttendanceCheck };
