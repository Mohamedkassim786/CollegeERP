/**
 * authController.js
 * Handles login for all roles: ADMIN, FACULTY, HOD, STUDENT, EXTERNAL_STAFF, etc.
 * Student login: username = rollNo, default password = DOB in DDMMYYYY format.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        // ── 1. Try User table first (System Admin/Principal) ─────────────────
        const user = await prisma.user.findUnique({ where: { username } });

        if (user) {
            if (user.isDisabled) {
                return res.status(403).json({ message: 'Account disabled. Contact administrator.' });
            }

            const valid = await bcrypt.compare(password, user.password);
            if (!valid) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    department: user.department
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            logger.info(`Login: ${user.username} (${user.role})`);

            return res.status(200).json({
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                department: user.department,
                forcePasswordChange: user.forcePasswordChange,
                accessToken: token
            });
        }

        // ── 2. Try Faculty table (staffId = username) ────────────────────────
        const faculty = await prisma.faculty.findUnique({
            where: { staffId: username }
        });

        if (faculty) {
            if (!faculty.isActive) {
                return res.status(403).json({ message: 'Account inactive. Contact administrator.' });
            }

            // For faculty, password123 is plain default, or hashed if changed
            let valid = false;
            if (faculty.password === 'password123') {
                valid = (password === 'password123');
            } else {
                valid = await bcrypt.compare(password, faculty.password);
            }

            if (!valid) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const token = jwt.sign(
                {
                    id: faculty.id,
                    username: faculty.staffId,
                    role: faculty.role,
                    department: faculty.department
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            logger.info(`Faculty Login: ${faculty.staffId} (${faculty.role})`);

            return res.status(200).json({
                id: faculty.id,
                username: faculty.staffId,
                role: faculty.role,
                fullName: faculty.fullName,
                department: faculty.department,
                photo: faculty.photo,
                isFirstLogin: faculty.isFirstLogin,
                accessToken: token
            });
        }

        // ── 2. Try Student table (rollNo = username) ──────────────────────────
        const student = await prisma.student.findUnique({
            where: { rollNo: username }
        });

        if (student) {
            // Default password: DOB in DDMMYYYY format or 'student' if DOB not set
            const defaultPassword = student.dateOfBirth
                ? formatDobPassword(student.dateOfBirth)
                : 'student';

            // If student has a custom password hash, compare with bcrypt
            // Otherwise compare with default plain password
            let valid = false;
            if (student.password) {
                // Hashed password set — use bcrypt
                valid = await bcrypt.compare(password, student.password);
            } else {
                // Default password: plain text compare
                valid = (password === defaultPassword);
            }

            if (!valid) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const token = jwt.sign(
                {
                    id: student.id,
                    username: student.rollNo,
                    role: 'STUDENT',
                    department: student.department
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            logger.info(`Student Login: ${student.rollNo} (${student.department})`);

            return res.status(200).json({
                id: student.id,
                username: student.rollNo,
                role: 'STUDENT',
                fullName: student.name,
                department: student.department,
                registerNumber: student.registerNumber,
                semester: student.semester,
                section: student.section,
                year: student.year,
                photo: student.photo || null,
                forcePasswordChange: !student.password, // Force change if still on default
                accessToken: token
            });
        }

        // Neither found
        return res.status(401).json({ message: 'Invalid credentials.' });

    } catch (error) {
        logger.error('Login error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * POST /api/auth/change-password
 * Allows students (and staff) to change their default password.
 */
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    try {
        const hashed = await bcrypt.hash(newPassword, 10);

        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { id } });
            if (!student) return res.status(404).json({ message: 'Student not found.' });

            // Verify current password
            const defaultPassword = student.dateOfBirth
                ? formatDobPassword(student.dateOfBirth)
                : 'student';

            let valid = false;
            if (student.password) {
                valid = await bcrypt.compare(currentPassword, student.password);
            } else {
                valid = currentPassword === defaultPassword;
            }

            if (!valid) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }

            await prisma.student.update({
                where: { id },
                data: { password: hashed }
            });
        } else if (role === 'FACULTY' || role === 'HOD') {
            const faculty = await prisma.faculty.findUnique({ where: { id } });
            if (!faculty) return res.status(404).json({ message: 'Faculty not found.' });

            let valid = false;
            if (faculty.password === 'password123') {
                valid = currentPassword === 'password123';
            } else {
                valid = await bcrypt.compare(currentPassword, faculty.password);
            }

            if (!valid) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }

            await prisma.faculty.update({
                where: { id },
                data: {
                    password: hashed,
                    isFirstLogin: false
                }
            });
        } else {
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) return res.status(404).json({ message: 'User not found.' });

            const valid = await bcrypt.compare(currentPassword, user.password);
            if (!valid) {
                return res.status(401).json({ message: 'Current password is incorrect.' });
            }

            await prisma.user.update({
                where: { id },
                data: {
                    password: hashed,
                    forcePasswordChange: false,
                    isFirstLogin: false,
                    lastPasswordChange: new Date()
                }
            });
        }

        logger.info(`Password changed for ${role} id=${id}`);
        return res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        logger.error('changePassword error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/** Converts a Date object or ISO string to DDMMYYYY format for default password */
function formatDobPassword(dob) {
    const d = new Date(dob);
    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year  = d.getFullYear();
    return `${day}${month}${year}`;
}

module.exports = { login, changePassword };
