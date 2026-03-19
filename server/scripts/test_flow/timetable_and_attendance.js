const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Timetable and Attendance Generation ---');

  const cseDept = await prisma.department.findUnique({ where: { name: 'Computer Science and Engineering' } });
  const mechDept = await prisma.department.findUnique({ where: { name: 'Mechanical Engineering' } });
  const cseFaculty = await prisma.faculty.findUnique({ where: { staffId: 'CSE_FAC001' } });
  const mechFaculty = await prisma.faculty.findUnique({ where: { staffId: 'MECH_FAC001' } });
  const cseSubjects = await prisma.subject.findMany({ where: { department: cseDept.name, semester: 2 } });
  const mechSubjects = await prisma.subject.findMany({ where: { department: mechDept.name, semester: 4 } });
  const cseStudents = await prisma.student.findMany({ where: { departmentId: cseDept.id, currentSemester: 2 } });
  const mechStudents = await prisma.student.findMany({ where: { departmentId: mechDept.id, currentSemester: 4 } });

  // 1. Timetable Generation
  // Basic timetable: 3 periods a day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timetableData = [];

  for (const day of days) {
    // CSE Timetable
    for (let p = 1; p <= 3; p++) {
      const sub = cseSubjects[(p - 1) % cseSubjects.length];
      timetableData.push({
        department: cseDept.name,
        year: 1,
        semester: 2,
        section: 'A',
        day: day,
        period: p,
        subjectId: sub.id,
        facultyId: cseFaculty.id,
        subjectName: sub.name,
        facultyName: cseFaculty.fullName
      });
    }
    // MECH Timetable
    for (let p = 1; p <= 3; p++) {
      const sub = mechSubjects[(p - 1) % mechSubjects.length];
      timetableData.push({
        department: mechDept.name,
        year: 2,
        semester: 4,
        section: 'A',
        day: day,
        period: p,
        subjectId: sub.id,
        facultyId: mechFaculty.id,
        subjectName: sub.name,
        facultyName: mechFaculty.fullName
      });
    }
  }

  for (const t of timetableData) {
    await prisma.timetable.upsert({
      where: {
        department_year_semester_section_day_period: {
          department: t.department,
          year: t.year,
          semester: t.semester,
          section: t.section,
          day: t.day,
          period: t.period
        }
      },
      update: t,
      create: t
    });
  }
  console.log('✓ Timetable entries created');

  // 2. Attendance Generation (Past 4 Weeks)
  const attendanceRecords = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 30); // 30 days ago

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayName === 'Saturday' || dayName === 'Sunday') continue;

    const dateStr = d.toISOString().split('T')[0];
    
    // Find timetable for this day
    const dayTimetables = await prisma.timetable.findMany({ where: { day: dayName } });

    for (const tt of dayTimetables) {
      if (tt.department === cseDept.name) {
        for (const student of cseStudents) {
          // 90% attendance chance
          const status = Math.random() > 0.1 ? 'PRESENT' : 'ABSENT';
          attendanceRecords.push({
            studentId: student.id,
            subjectId: tt.subjectId,
            facultyId: tt.facultyId,
            date: dateStr,
            period: tt.period,
            status: status
          });
        }
      } else if (tt.department === mechDept.name) {
        for (const student of mechStudents) {
          const status = student.rollNo.endsWith('005') ? (Math.random() > 0.4 ? 'PRESENT' : 'ABSENT') : (Math.random() > 0.1 ? 'PRESENT' : 'ABSENT');
          // Let student 005 have poor attendance (60% chance) to check "DETAINED" status later
          attendanceRecords.push({
            studentId: student.id,
            subjectId: tt.subjectId,
            facultyId: tt.facultyId,
            date: dateStr,
            period: tt.period,
            status: status
          });
        }
      }
    }
  }

  // Use createMany if supported by sqlite or just loop
  for (const record of attendanceRecords) {
    await prisma.studentAttendance.upsert({
      where: {
        studentId_subjectId_date_period: {
          studentId: record.studentId,
          subjectId: record.subjectId,
          date: record.date,
          period: record.period
        }
      },
      update: { status: record.status },
      create: record
    });
  }
  console.log(`✓ ${attendanceRecords.length} Attendance records generated`);

  console.log('--- Timetable and Attendance Generation Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
