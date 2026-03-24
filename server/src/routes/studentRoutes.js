// studentRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, isStudent } = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

router.use(verifyToken);
router.use(isStudent);

// GET /api/student/attendance — subject-wise attendance for logged-in student
router.get('/attendance', async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await prisma.student.findUnique({ 
      where: { id: studentId },
      include: { departmentRef: true }
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Resolve Department Code (student.department might be full name)
    const deptCode = student.departmentRef?.code || student.department;
    const fetchDept = student.year === 1 ? 'FIRST_YEAR' : (deptCode === 'Mechanical Engineering' ? 'MECH' : deptCode);

    const assignments = await prisma.facultyAssignment.findMany({
      where: { 
        section: student.section, 
        OR: [
          { department: fetchDept },
          { department: { contains: fetchDept } }
        ]
      },
      include: { subject: true, faculty: true }
    });

    const relevantAssignments = assignments.filter(a => a.subject.semester === student.semester);
    const subjectIds = relevantAssignments.map(a => a.subjectId);

    // Fetch all attendance records with timestamps
    const allAttendance = await prisma.studentAttendance.findMany({
      where: { studentId, subjectId: { in: subjectIds } },
      orderBy: { date: 'desc' },
      select: { subjectId: true, status: true, date: true, period: true }
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
        status: total === 0 ? 'NO_DATA' : ratio >= 0.75 ? 'ELIGIBLE' : ratio >= 0.65 ? 'CONDONATION' : 'DETAINED',
        details: records // This provides the "period wise" data requested
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
    const processedMarks = marks.map(m => {
      const cia1_total = (m.cia1_test || 0) + (m.cia1_assignment || 0) + (m.cia1_attendance || 0);
      const cia2_total = (m.cia2_test || 0) + (m.cia2_assignment || 0) + (m.cia2_attendance || 0);
      const cia3_total = (m.cia3_test || 0) + (m.cia3_assignment || 0) + (m.cia3_attendance || 0);
      return {
        ...m,
        cia1_total,
        cia2_total,
        cia3_total,
        endSemMarks: m.endSemMarks?.isPublished ? m.endSemMarks : null
      };
    });
    res.json(processedMarks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/student/timetable — student's class timetable
router.get('/timetable', async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await prisma.student.findUnique({ 
      where: { id: studentId },
      include: { departmentRef: true }
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Resolve Dept Code for timetable matching
    const deptCode = student.departmentRef?.code || student.department;
    const fetchDept = student.year === 1 ? 'FIRST_YEAR' : (deptCode === 'Mechanical Engineering' ? 'MECH' : deptCode);

    const timetable = await prisma.timetable.findMany({
      where: { 
        department: fetchDept, 
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
