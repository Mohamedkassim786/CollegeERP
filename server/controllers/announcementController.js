const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, category, department, year, semester, section } = req.body;
        const postedBy = req.user.id;

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                category: category || 'GENERAL',
                department,
                year: year ? parseInt(year) : null,
                semester: semester ? parseInt(semester) : null,
                section,
                postedBy
            }
        });

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const { role, department, id } = req.user;

        let where = {};

        // If faculty, they might want to see all or filter by their department
        if (role === 'FACULTY') {
            where = {
                OR: [
                    { department: department },
                    { department: null }
                ]
            };
        } else if (role === 'ADMIN') {
            // Admins see everything
            where = {};
        }

        const announcements = await prisma.announcement.findMany({
            where,
            include: {
                author: {
                    select: {
                        fullName: true,
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const announcement = await prisma.announcement.findUnique({
            where: { id: parseInt(id) }
        });

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Only author or admin can delete
        if (announcement.postedBy !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this announcement' });
        }

        await prisma.announcement.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
