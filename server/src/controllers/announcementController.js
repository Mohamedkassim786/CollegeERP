const prisma = require('../lib/prisma');
const { handleError } = require('../utils/errorUtils');

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
        handleError(res, error, "Failed to create announcement");
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const { role, department, id } = req.user;

        let where = {};

        if (role === 'ADMIN') {
            // Admins see everything
            where = {};
        } else if (role === 'FACULTY' || role === 'HOD') {
            // Faculty/HOD see department-specific + college-wide announcements
            where = {
                OR: [
                    { department: department },
                    { department: null }
                ]
            };
            // Students see only their matching announcements
            const student = await prisma.student.findUnique({
                where: { id: req.user.id }
            });

            if (student) {
                where = {
                    OR: [
                        {
                            // Exact match for their dept + section + semester
                            department: student.department,
                            section: student.section,
                            semester: student.semester
                        },
                        {
                            // Department-wide (no section/semester filter)
                            department: student.department,
                            section: null,
                            semester: null
                        },
                        {
                            // College-wide general announcements
                            department: null,
                            section: null
                        }
                    ]
                };
            } else {
                // Student record not found — show general only
                where = { department: null };
            }
        }
        // For EXTERNAL/PRINCIPAL/COE roles — show general only
        else {
            where = { department: null };
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
        handleError(res, error, "Failed to get announcements");
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
        handleError(res, error, "Failed to delete announcement");
    }
};
