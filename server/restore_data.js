const { PrismaClient: NewPrismaClient } = require('@prisma/client');
const { PrismaClient: OldPrismaClient } = require('./prisma/generated-old-client');

const newPrisma = new NewPrismaClient();
const oldPrisma = new OldPrismaClient();

async function restore() {
    console.log('--- Data Restoration Started ---');

    try {
        // Order of restoration counts for foreign keys

        // 1. Departments
        const departments = await oldPrisma.department.findMany();
        console.log(`Found ${departments.length} departments`);
        for (const d of departments) {
            await newPrisma.department.upsert({
                where: { id: d.id },
                update: d,
                create: d
            });
        }

        // 2. Users
        const users = await oldPrisma.user.findMany();
        console.log(`Found ${users.length} users`);
        for (const u of users) {
            await newPrisma.user.upsert({
                where: { id: u.id },
                update: {
                    ...u,
                    role: u.role // matches new schema
                },
                create: {
                    ...u,
                    role: u.role
                }
            });
        }

        // 3. Students
        const students = await oldPrisma.student.findMany();
        console.log(`Found ${students.length} students`);
        for (const s of students) {
            await newPrisma.student.upsert({
                where: { id: s.id },
                update: s,
                create: s
            });
        }

        // 4. Subjects
        const subjects = await oldPrisma.subject.findMany();
        console.log(`Found ${subjects.length} subjects`);
        for (const sub of subjects) {
            await newPrisma.subject.upsert({
                where: { id: sub.id },
                update: sub,
                create: sub
            });
        }

        // 5. Timetable
        const timetables = await oldPrisma.timetable.findMany();
        console.log(`Found ${timetables.length} timetable entries`);
        for (const t of timetables) {
            await newPrisma.timetable.upsert({
                where: { id: t.id },
                update: t,
                create: t
            });
        }

        // 6. Marks
        const marks = await oldPrisma.marks.findMany();
        console.log(`Found ${marks.length} marks entries`);
        for (const m of marks) {
            await newPrisma.marks.upsert({
                where: { id: m.id },
                update: m,
                create: m
            });
        }

        // 7. Attendance
        const attendance = await oldPrisma.studentAttendance.findMany();
        console.log(`Found ${attendance.length} attendance records`);
        for (const a of attendance) {
            await newPrisma.studentAttendance.upsert({
                where: { id: a.id },
                update: a,
                create: a
            });
        }

        // 8. Assignments
        const assignments = await oldPrisma.facultyAssignment.findMany();
        console.log(`Found ${assignments.length} faculty assignments`);
        for (const fa of assignments) {
            await newPrisma.facultyAssignment.upsert({
                where: { id: fa.id },
                update: fa,
                create: fa
            });
        }

        console.log('--- Data Restoration Completed Successfully ---');
    } catch (error) {
        console.error('Restoration failed:', error);
    } finally {
        await newPrisma.$disconnect();
        await oldPrisma.$disconnect();
    }
}

restore();
