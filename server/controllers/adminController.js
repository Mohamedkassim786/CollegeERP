const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const { handleError } = require('../utils/errorUtils');

// --- Faculty Management ---

const getAllFaculty = async (req, res) => {
    try {
        const faculty = await prisma.user.findMany({
            where: { role: 'FACULTY' },
            select: { id: true, username: true, fullName: true, department: true, createdAt: true }
        });
        res.json(faculty);
    } catch (error) {
        handleError(res, error, "Error fetching faculty");
    }
};

const createFaculty = async (req, res) => {
    const { username, password, fullName, department } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newFaculty = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: 'FACULTY',
                fullName,
                department
            }
        });
        res.status(201).json({ message: 'Faculty created', faculty: { username, fullName } });
    } catch (error) {
        handleError(res, error, "Error creating faculty");
    }
};

const deleteFaculty = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Faculty deleted' });
    } catch (error) {
        handleError(res, error, "Error deleting faculty");
    }
};

// --- Timetable Management ---

const getTimetable = async (req, res) => {
    try {
        const { department, year, semester, section } = req.query;
        console.log(`[TT_v2.1] Fetching: ${department} Y${year} S${semester} Sec${section}`);

        // Strict filtering: if any context is missing, return empty to prevent data leakage
        if (!department || !year || !semester || !section) {
            return res.json([]);
        }

        const timetable = await prisma.timetable.findMany({
            where: {
                department: department,
                year: parseInt(year),
                semester: parseInt(semester),
                section: section
            },
            include: { subject: true, faculty: true }
        });
        res.json(timetable);
    } catch (error) {
        handleError(res, error, "Error fetching timetable");
    }
};

const saveTimetable = async (req, res) => {
    const { entries, department, year, semester, section } = req.body;
    console.log(`[Timetable] Saving: ${department} Y${year} S${semester} Sec${section} - ${entries?.length || 0} entries`);
    try {
        if (!department || !year || !semester || !section) {
            return res.status(400).json({ message: "Missing filter context for saving timetable" });
        }

        const yr = parseInt(year);
        const sem = parseInt(semester);

        await prisma.$transaction(async (tx) => {
            // 1. Delete ALL existing entries for this specific combination
            // This ensures "deleted" cells in UI are actually removed from DB
            await tx.timetable.deleteMany({
                where: {
                    department,
                    year: yr,
                    semester: sem,
                    section
                }
            });

            // 2. Insert new entries
            if (entries.length > 0) {
                await tx.timetable.createMany({
                    data: entries.map(e => ({
                        department,
                        year: yr,
                        semester: sem,
                        section,
                        day: e.day,
                        period: e.period,
                        duration: e.duration || 1,
                        type: e.type,
                        subjectName: e.subjectName,
                        facultyName: e.facultyName,
                        room: e.room,
                        subjectId: e.subjectId,
                        facultyId: e.facultyId
                    }))
                });
            }
        });

        res.json({ message: "Timetable updated successfully" });
    } catch (error) {
        handleError(res, error, "Error saving timetable");
    }
};

// --- Faculty Absence & Substitution ---

const getAbsences = async (req, res) => {
    try {
        const absences = await prisma.facultyAbsence.findMany({
            include: { faculty: true }
        });
        res.json(absences);
    } catch (error) {
        handleError(res, error, "Error fetching absences");
    }
};

const markFacultyAbsent = async (req, res) => {
    const { facultyId, date, reason } = req.body;
    try {
        const fId = parseInt(facultyId);
        // Simplified Logic
        await prisma.facultyAbsence.create({
            data: { facultyId: fId, date, reason, period: 0 }
        });
        res.json({ message: 'Marked absent' });
    } catch (error) {
        handleError(res, error, "Error marking absence");
    }
};

const removeFacultyAbsence = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.facultyAbsence.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Absence removed' });
    } catch (error) {
        handleError(res, error, "Error removing absence");
    }
};

const getSubstitutions = async (req, res) => {
    try {
        const subs = await prisma.substitution.findMany({
            include: { timetable: true, substituteFaculty: true }
        });
        res.json(subs);
    } catch (error) {
        handleError(res, error, "Error fetching substitutions");
    }
};

const assignSubstitute = async (req, res) => {
    const { timetableId, substituteFacultyId, date } = req.body;
    try {
        const sub = await prisma.substitution.create({
            data: {
                timetableId: parseInt(timetableId),
                substituteFacultyId: parseInt(substituteFacultyId),
                date
            }
        });
        res.json(sub);
    } catch (error) {
        handleError(res, error, "Error assigning substitute");
    }
};

const deleteSubstitution = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.substitution.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Substitution deleted' });
    } catch (error) {
        handleError(res, error, "Error deleting substitution");
    }
};

module.exports = {
    getAllFaculty,
    createFaculty,
    deleteFaculty,
    getTimetable,
    saveTimetable,
    getAbsences,
    markFacultyAbsent,
    removeFacultyAbsence,
    getSubstitutions,
    assignSubstitute,
    deleteSubstitution
};
