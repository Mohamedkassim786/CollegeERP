const prisma = require('../lib/prisma');
const { handleError } = require('../utils/errorUtils');

exports.uploadMaterial = async (req, res) => {
    try {
        const { title, description, fileUrl, subjectId } = req.body;
        const instructorId = req.user.id;

        const material = await prisma.material.create({
            data: {
                title,
                description,
                fileUrl,
                subjectId: parseInt(subjectId),
                instructorId
            }
        });

        res.status(201).json(material);
    } catch (error) {
        handleError(res, error, "Failed to upload material");
    }
};

exports.getMaterials = async (req, res) => {
    try {
        const { subjectId } = req.query;
        const { role, department } = req.user;

        let where = {};
        if (subjectId) {
            where.subjectId = parseInt(subjectId);
        }

        // If specific logic for student/faculty visibility is needed, it can be added here
        // For now, return all materials for the requested subject or all if none requested

        const materials = await prisma.material.findMany({
            where,
            include: {
                subject: {
                    select: {
                        name: true,
                        code: true
                    }
                },
                instructor: {
                    select: {
                        fullName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(materials);
    } catch (error) {
        handleError(res, error, "Failed to get materials");
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const material = await prisma.material.findUnique({
            where: { id: parseInt(id) }
        });

        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        if (material.instructorId !== user.id && user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }

        await prisma.material.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        handleError(res, error, "Failed to delete material");
    }
};
