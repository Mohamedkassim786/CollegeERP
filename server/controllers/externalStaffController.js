const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAssignedAssignments = async (req, res) => {
    try {
        const staffId = req.user.id;
        const assignments = await prisma.externalMarkAssignment.findMany({
            where: { staffId },
            include: { subject: true }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllAssignmentsForAdmin = async (req, res) => {
    try {
        const assignments = await prisma.externalMarkAssignment.findMany({
            include: {
                subject: true,
                staff: {
                    select: { fullName: true, username: true }
                }
            }
        });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignMarkEntry = async (req, res) => {
    try {
        const { staffId, subjectId, deadline } = req.body;

        const subIdInt = parseInt(subjectId);

        // Fetch subject to check category
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const category = subject.subjectCategory || 'THEORY';

        // 🧱 For THEORY subjects: dummy mapping must be locked before assignment
        if (category === 'THEORY') {
            const dummyMapping = await prisma.subjectDummyMapping.findFirst({
                where: { subjectId: subIdInt }
            });
            if (!dummyMapping) {
                return res.status(400).json({ message: 'Dummy numbers not generated for this subject yet' });
            }
            if (!dummyMapping.mappingLocked) {
                return res.status(400).json({ message: 'Dummy mapping must be locked before assignment' });
            }
        }
        // LAB and INTEGRATED: no dummy mapping required — external staff works by register number

        // Check if already assigned and not completed
        const existingAssignment = await prisma.externalMarkAssignment.findFirst({
            where: {
                subjectId: subIdInt,
                status: { in: ['PENDING', 'SUBMITTED', 'COMPLETED'] }
            }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: 'Subject already assigned or valuation completed' });
        }

        const assignment = await prisma.externalMarkAssignment.create({
            data: {
                staffId: parseInt(staffId),
                subjectId: subIdInt,
                deadline: new Date(deadline),
                status: 'PENDING'
            }
        });
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAvailableSubjectsForAssignment = async (req, res) => {
    try {
        // Already-assigned subject IDs (to exclude)
        const activeAssignments = await prisma.externalMarkAssignment.findMany({
            where: { status: { in: ['PENDING', 'SUBMITTED', 'COMPLETED', 'LOCKED'] } },
            select: { subjectId: true }
        });
        const assignedIds = activeAssignments.map(a => a.subjectId);

        // 1. THEORY subjects — must have locked dummy mapping
        const theorySubjectsWithLockedDummies = await prisma.subjectDummyMapping.findMany({
            where: { mappingLocked: true },
            select: { subjectId: true },
            distinct: ['subjectId']
        });
        const theoryIds = theorySubjectsWithLockedDummies.map(d => d.subjectId)
            .filter(id => !assignedIds.includes(id));

        // 2. LAB and INTEGRATED subjects
        // These can be assigned as soon as they exist (no dummy mapping required)
        const labIntegratedSubjects = await prisma.subject.findMany({
            where: {
                subjectCategory: { in: ['LAB', 'INTEGRATED'] },
                id: { notIn: assignedIds }
            },
            select: { id: true }
        });
        const labIntegratedIds = labIntegratedSubjects.map(s => s.id);

        // Combine all qualifying IDs
        const allQualifyingIds = [...new Set([...theoryIds, ...labIntegratedIds])];

        const availableSubjects = await prisma.subject.findMany({
            where: { id: { in: allQualifyingIds } },
            orderBy: [{ subjectCategory: 'asc' }, { semester: 'asc' }]
        });

        res.json(availableSubjects);
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
        const staffId = parseInt(id);

        if (isNaN(staffId)) {
            return res.status(400).json({ message: "Invalid staff ID" });
        }

        // Use a transaction to delete all related data first, then the staff member
        await prisma.$transaction([
            prisma.externalMark.deleteMany({
                where: { submittedBy: staffId }
            }),
            prisma.externalMarkAssignment.deleteMany({
                where: { staffId: staffId }
            }),
            prisma.user.delete({
                where: { id: staffId }
            })
        ]);

        res.json({ message: 'Staff and all related data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignmentId = parseInt(id);
        if (isNaN(assignmentId)) {
            return res.status(400).json({ message: "Invalid assignment ID" });
        }
        await prisma.externalMarkAssignment.delete({
            where: { id: assignmentId }
        });
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
