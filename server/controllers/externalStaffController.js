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
        const { staffId, subjectId, component, deadline } = req.body;

        const subIdInt = parseInt(subjectId);
        const comp = component || 'THEORY';

        // Fetch subject to check category
        const subject = await prisma.subject.findUnique({ where: { id: subIdInt } });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const category = subject.subjectCategory || 'THEORY';

        // 🧱 For THEORY subjects (and Integrated Theory): internal approval + dummy mapping must be locked
        if (category === 'THEORY' || (category === 'INTEGRATED' && comp === 'THEORY')) {
            // Check Internal Approval Gate
            const internalApproved = await prisma.marks.findFirst({
                where: { subjectId: subIdInt, isApproved: true }
            });
            if (!internalApproved) {
                return res.status(400).json({ message: 'Internal marks must be approved before external assignment' });
            }

            const dummyMapping = await prisma.subjectDummyMapping.findFirst({
                where: { subjectId: subIdInt }
            });
            if (!dummyMapping) {
                return res.status(400).json({ message: 'Dummy numbers not generated for this subject yet' });
            }
            if (!dummyMapping.mappingLocked) {
                return res.status(400).json({ message: 'Dummy mapping must be locked before assignment' });
            }
        } else if (category === 'LAB' || (category === 'INTEGRATED' && comp === 'LAB')) {
            // Check Internal Approval Gate for Lab
            const internalApproved = await prisma.marks.findFirst({
                where: { subjectId: subIdInt, isApproved: true }
            });
            if (!internalApproved) {
                return res.status(400).json({ message: 'Internal marks must be approved before external assignment' });
            }
        }

        // Check if already assigned for THIS component
        const existingAssignment = await prisma.externalMarkAssignment.findFirst({
            where: {
                subjectId: subIdInt,
                component: comp,
                status: { in: ['PENDING', 'SUBMITTED', 'COMPLETED'] }
            }
        });

        if (existingAssignment) {
            return res.status(400).json({ message: `This subject's ${comp} component is already assigned` });
        }

        const assignment = await prisma.externalMarkAssignment.create({
            data: {
                staffId: parseInt(staffId),
                subjectId: subIdInt,
                component: comp,
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
        // Active assignments to exclude
        const activeAssignments = await prisma.externalMarkAssignment.findMany({
            where: { status: { in: ['PENDING', 'SUBMITTED', 'COMPLETED', 'LOCKED'] } },
            select: { subjectId: true, component: true }
        });

        // 1. THEORY and INTEGRATED (Theory) — must have internal approval + locked dummy mapping
        const theoryLockedDummies = await prisma.subjectDummyMapping.findMany({
            where: { mappingLocked: true },
            select: { subjectId: true }
        });
        const lockedDummyIds = theoryLockedDummies.map(d => d.subjectId);

        // Subjects with at least one approved internal mark student
        const internalApprovedSubjects = await prisma.marks.findMany({
            where: { isApproved: true },
            select: { subjectId: true },
            distinct: ['subjectId']
        });
        const approvedSubjectIds = internalApprovedSubjects.map(m => m.subjectId);

        // Fetch all subjects to filter
        const allSubjects = await prisma.subject.findMany({
            where: { id: { in: approvedSubjectIds } }
        });

        const available = [];

        for (const sub of allSubjects) {
            const category = sub.subjectCategory || 'THEORY';

            if (category === 'THEORY') {
                if (lockedDummyIds.includes(sub.id)) {
                    const isAssigned = activeAssignments.some(a => a.subjectId === sub.id && a.component === 'THEORY');
                    if (!isAssigned) available.push({ ...sub, componentSlot: 'THEORY' });
                }
            } else if (category === 'LAB') {
                const isAssigned = activeAssignments.some(a => a.subjectId === sub.id && a.component === 'LAB');
                if (!isAssigned) available.push({ ...sub, componentSlot: 'LAB' });
            } else if (category === 'INTEGRATED') {
                // Check Theory slot
                const theoryAssigned = activeAssignments.some(a => a.subjectId === sub.id && a.component === 'THEORY');
                if (!theoryAssigned && lockedDummyIds.includes(sub.id)) {
                    available.push({ ...sub, componentSlot: 'THEORY', displayName: `${sub.name} (Theory)` });
                }
                // Check Lab slot
                const labAssigned = activeAssignments.some(a => a.subjectId === sub.id && a.component === 'LAB');
                if (!labAssigned) {
                    available.push({ ...sub, componentSlot: 'LAB', displayName: `${sub.name} (Lab)` });
                }
            }
        }

        res.json(available);
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
