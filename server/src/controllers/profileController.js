const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get current user profile (Staff or Student)
 */
const getProfile = async (req, res) => {
    try {
        const { id, role } = req.user;

        if (role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { id },
                include: {
                    departmentRef: true,
                    sectionRef: true,
                    academicYear: true
                }
            });
            if (!student) return res.status(404).json({ message: 'Student not found' });
            return res.json(student);
        }

        // Staff roles
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                role: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                department: true,
                designation: true,
                employeeId: true,
                dateOfBirth: true,
                photoUrl: true,
                isHOD: true,
                isFirstLogin: true,
                lastPasswordChange: true,
                lastLogin: true
            }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        logger.error('getProfile error', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update personal information (Staff or Student)
 */
const updateProfile = async (req, res) => {
    const { fullName, phoneNumber, email, designation, employeeId, dateOfBirth } = req.body;
    const { id, role } = req.user;

    try {
        if (role === 'STUDENT') {
            // Students can currently only update phoneNumber/email locally if allowed
            // Typically student updates are restricted
            const updatedStudent = await prisma.student.update({
                where: { id },
                data: {
                    phoneNumber: phoneNumber || undefined,
                    email: email || undefined
                }
            });
            return res.json(updatedStudent);
        }

        // Staff updates
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (designation) updateData.designation = designation;
        if (employeeId) updateData.employeeId = employeeId;
        if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);

        // Functional requirements:
        // Admin: Email is editable
        // Others: Email might be restricted (using role-based check if needed)
        if (role === 'ADMIN' && email) {
            updateData.email = email;
        } else if (email) {
            // Default: allow others to update email too for now unless specifically restricted
            updateData.email = email;
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json(updatedUser);
    } catch (error) {
        logger.error('updateProfile error', error);
        res.status(500).json({ message: error.message });
    }
};

// --- Admin Only Faculty Management ---

/**
 * List all faculty members
 */
const getAllFaculty = async (req, res) => {
    try {
        const faculty = await prisma.user.findMany({
            where: { role: 'FACULTY' },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                department: true,
                designation: true,
                employeeId: true,
                isDisabled: true,
                lastLogin: true
            }
        });
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Reset a faculty member's password
 */
const resetFacultyPassword = async (req, res) => {
    const { facultyId, newPassword } = req.body;
    try {
        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: parseInt(facultyId) },
            data: {
                password: hashed,
                forcePasswordChange: true,
                isFirstLogin: true // Force them to change and re-set profile
            }
        });

        // Log Action
        await prisma.activityLog.create({
            data: {
                action: 'RESET_PASSWORD',
                description: `Reset password for faculty ID ${facultyId}`,
                performedBy: req.user.id,
                targetId: parseInt(facultyId)
            }
        });

        res.json({ message: 'Faculty password reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Enable/Disable faculty account
 */
const toggleFacultyStatus = async (req, res) => {
    const { facultyId, isDisabled } = req.body;
    try {
        await prisma.user.update({
            where: { id: parseInt(facultyId) },
            data: { isDisabled: !!isDisabled }
        });

        // Log Action
        await prisma.activityLog.create({
            data: {
                action: isDisabled ? 'DISABLE_ACCOUNT' : 'ENABLE_ACCOUNT',
                description: `${isDisabled ? 'Disabled' : 'Enabled'} faculty account ID ${facultyId}`,
                performedBy: req.user.id,
                targetId: parseInt(facultyId)
            }
        });

        res.json({ message: `Faculty account ${isDisabled ? 'disabled' : 'enabled'} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Admin: Get recent activity logs
 */
const getActivityLogs = async (req, res) => {
    try {
        const logs = await prisma.activityLog.findMany({
            orderBy: { timestamp: 'desc' },
            include: {
                performer: {
                    select: { fullName: true, username: true }
                }
            },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    getAllFaculty,
    resetFacultyPassword,
    toggleFacultyStatus,
    getActivityLogs
};
