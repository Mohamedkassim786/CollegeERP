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
      where: { section: student.section },
      include: { subject: true, faculty: true }
    });

    const result = [];
    for (const a of assignments) {
      if (a.subject.semester !== student.semester) continue;
      const total = await prisma.studentAttendance.count({
        where: { studentId, subjectId: a.subjectId }
      });
      const present = await prisma.studentAttendance.count({
        where: { studentId, subjectId: a.subjectId, status: { in: ['PRESENT', 'OD'] } }
      });
      result.push({
        subject: a.subject,
        faculty: a.faculty?.fullName,
        total, present,
        absent: total - present,
        percentage: total > 0 ? ((present / total) * 100).toFixed(1) : '0.0',
        status: total === 0 ? 'NO_DATA' : (present / total) >= 0.75 ? 'ELIGIBLE' : (present / total) >= 0.65 ? 'CONDONATION' : 'DETAINED'
      });
    }
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
