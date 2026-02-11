const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAssignedTasks = async (req, res) => {
    try {
        const staffId = req.user.id;
        const tasks = await prisma.externalStaffTask.findMany({
            where: { staffId },
            include: { subject: true }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitQuestionPaper = async (req, res) => {
    try {
        const { taskId, questionPaperUrl, remarks } = req.body;
        const task = await prisma.externalStaffTask.update({
            where: { id: parseInt(taskId) },
            data: {
                questionPaperUrl,
                remarks,
                status: 'SUBMITTED',
                updatedAt: new Date()
            }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTasksForAdmin = async (req, res) => {
    try {
        const tasks = await prisma.externalStaffTask.findMany({
            include: {
                subject: true,
                staff: {
                    select: { fullName: true, username: true }
                }
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignTask = async (req, res) => {
    try {
        const { staffId, subjectId, deadline } = req.body;
        const task = await prisma.externalStaffTask.create({
            data: {
                staffId: parseInt(staffId),
                subjectId: parseInt(subjectId),
                deadline: new Date(deadline),
                status: 'ASSIGNED'
            }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId, status } = req.body;
        const task = await prisma.externalStaffTask.update({
            where: { id: parseInt(taskId) },
            data: { status }
        });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllExternalStaff = async (req, res) => {
    try {
        const staff = await prisma.user.findMany({
            where: { role: 'EXTERNAL_STAFF' },
            select: { id: true, username: true, fullName: true, createdAt: true }
        });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createExternalStaff = async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'EXTERNAL_STAFF',
                fullName
            }
        });
        res.json({ message: 'External staff created successfully', user: { id: user.id, username: user.username, fullName: user.fullName } });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.deleteExternalStaff = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[EXTERNAL] Attempting to delete task: ${id}`);
        const taskId = parseInt(id);
        if (isNaN(taskId)) {
            console.error(`[EXTERNAL] Invalid task ID: ${id}`);
            return res.status(400).json({ message: "Invalid task ID" });
        }
        await prisma.externalStaffTask.delete({
            where: { id: taskId }
        });
        console.log(`[EXTERNAL] Successfully deleted task: ${id}`);
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(`[EXTERNAL] Error deleting task ${req.params.id}:`, error.message);
        res.status(500).json({ message: error.message });
    }
};
