const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        handleError(res, error, "Error fetching system settings");
    }
};

const updateSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
        });
        res.json({ message: 'Setting updated', setting });
    } catch (error) {
        handleError(res, error, "Error updating system setting");
    }
};

module.exports = {
    getSettings,
    updateSetting
};
