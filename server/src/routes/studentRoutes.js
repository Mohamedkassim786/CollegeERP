// studentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isStudent } = require('../middleware/authMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(verifyToken);
router.use(isStudent);

// GET /api/student/attendance — subject-wise attendance for logged-in student
router.get('/attendance', async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const assignments = await prisma.facultyAssignment.findMany({
      where: { section: student.section, department: student.department },
      include: { subject: true, faculty: true }
    });

    const relevantAssignments = assignments.filter(a => a.subject.semester === student.semester);
    const subjectIds = relevantAssignments.map(a => a.subjectId);

    // Single query for all attendance records — no N+1
    const allAttendance = await prisma.studentAttendance.findMany({
      where: { studentId, subjectId: { in: subjectIds } },
      select: { subjectId: true, status: true }
    });

    const result = relevantAssignments.map(a => {
      const records = allAttendance.filter(r => r.subjectId === a.subjectId);
      const total = records.length;
      const present = records.filter(r => r.status === 'PRESENT' || r.status === 'OD').length;
      const ratio = total > 0 ? present / total : 0;
      return {
        subject: a.subject,
        faculty: a.faculty?.fullName,
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? (ratio * 100).toFixed(1) : '0.0',
        status: total === 0 ? 'NO_DATA' : ratio >= 0.75 ? 'ELIGIBLE' : ratio >= 0.65 ? 'CONDONATION' : 'DETAINED'
      };
    });

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/student/marks — CIA marks per subject
router.get('/marks', async (req, res) => {
  try {
    const studentId = req.user.id;
    const marks = await prisma.marks.findMany({
      where: { studentId },
      include: { subject: true, endSemMarks: true }
    });
    res.json(marks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/student/timetable — student's class timetable
router.get('/timetable', async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const timetable = await prisma.timetable.findMany({
      where: { 
        department: student.department, 
        semester: student.semester, 
        section: student.section,
        year: student.year 
      },
      include: { subject: true, faculty: { select: { fullName: true } } },
      orderBy: [{ day: 'asc' }, { period: 'asc' }]
    });
    res.json(timetable);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
