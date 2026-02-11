const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000/api';
let adminToken, facultyToken, externalToken;

const TEST_PASSWORD = 'testpassword123';
const HASHED_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

async function setupUsers() {
    console.log('--- Setting up Test Users ---');
    await prisma.user.upsert({
        where: { username: 'test_admin' },
        update: { password: HASHED_PASSWORD, role: 'ADMIN' },
        create: { username: 'test_admin', password: HASHED_PASSWORD, role: 'ADMIN', fullName: 'Test Admin' }
    });
    await prisma.user.upsert({
        where: { username: 'test_faculty' },
        update: { password: HASHED_PASSWORD, role: 'FACULTY' },
        create: { username: 'test_faculty', password: HASHED_PASSWORD, role: 'FACULTY', fullName: 'Test Faculty' }
    });
    await prisma.user.upsert({
        where: { username: 'test_external' },
        update: { password: HASHED_PASSWORD, role: 'EXTERNAL_STAFF' },
        create: { username: 'test_external', password: HASHED_PASSWORD, role: 'EXTERNAL_STAFF', fullName: 'Test External' }
    });
}

async function cleanupUsers() {
    console.log('--- Cleaning up Test Users ---');
    await prisma.user.deleteMany({
        where: { username: { in: ['test_admin', 'test_faculty', 'test_external'] } }
    });
}

async function runTests() {
    console.log('🚀 Starting Complete System Verification...');

    try {
        await setupUsers();

        // --- 1. AUTHENTICATION ---
        console.log('\n--- 1. Authentication Testing ---');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { username: 'test_admin', password: TEST_PASSWORD });
        adminToken = adminLogin.data.accessToken;
        console.log('✅ Admin login successful');

        const facultyLogin = await axios.post(`${BASE_URL}/auth/login`, { username: 'test_faculty', password: TEST_PASSWORD });
        facultyToken = facultyLogin.data.accessToken;
        console.log('✅ Faculty login successful');

        const externalLogin = await axios.post(`${BASE_URL}/auth/login`, { username: 'test_external', password: TEST_PASSWORD });
        externalToken = externalLogin.data.accessToken;
        console.log('✅ External staff login successful');


        // --- 2. END SEMESTER & GPA LOGIC ---
        console.log('\n--- 2. End Semester & GPA Logic Testing ---');

        // Ensure we have a student and subject
        let student = await prisma.student.findFirst();
        let subject = await prisma.subject.findFirst();

        if (!student || !subject) {
            console.log('Creating test student/subject...');
            subject = await prisma.subject.create({ data: { code: 'TEST101', name: 'Test Subject', semester: 1, credits: 3 } });
            student = await prisma.student.create({ data: { registerNumber: 'TESTSTUDENT', name: 'Test Student', semester: 1, year: 1, department: 'TEST', section: 'A' } });
        }

        await prisma.marks.upsert({
            where: { studentId_subjectId: { studentId: student.id, subjectId: subject.id } },
            update: { internal: 45 },
            create: { studentId: student.id, subjectId: subject.id, internal: 45 }
        });

        // Test Update Marks (Faculty)
        const updateRes = await axios.post(`${BASE_URL}/exam/end-sem-marks`, {
            marksData: [{ studentId: student.id, externalMarks: 50 }],
            subjectId: subject.id,
            semester: student.semester
        }, { headers: { Authorization: `Bearer ${facultyToken}` } });
        console.log('✅ Update End Sem Marks (Faculty):', updateRes.data.message);

        // Test GPA Calculation
        const gpaRes = await axios.post(`${BASE_URL}/exam/calculate-gpa`, {
            studentId: student.id,
            semester: student.semester
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ GPA/CGPA Calculation:', gpaRes.data);


        // --- 3. LOCK MECHANISM ---
        console.log('\n--- 3. Lock Mechanism Testing ---');
        await axios.post(`${BASE_URL}/exam/semester-control`, {
            department: student.department,
            year: student.year,
            semester: student.semester,
            section: student.section,
            field: 'isLocked',
            value: true
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Admin locked semester');

        try {
            await axios.post(`${BASE_URL}/exam/end-sem-marks`, {
                marksData: [{ studentId: student.id, externalMarks: 60 }],
                subjectId: subject.id,
                semester: student.semester
            }, { headers: { Authorization: `Bearer ${facultyToken}` } });
            console.log('❌ UNEXPECTED: Faculty could update marks after lock');
        } catch (e) {
            console.log('✅ Faculty blocked from updating locked semester (Expected)');
        }


        // --- 4. ROLE-BASED ACCESS (RBAC) ---
        console.log('\n--- 4. Role-Based Access Testing ---');
        try {
            await axios.get(`${BASE_URL}/admin/faculty`, { headers: { Authorization: `Bearer ${externalToken}` } });
            console.log('❌ UNEXPECTED: External could access faculty data');
        } catch (e) {
            console.log('✅ External staff blocked from Admin data (Expected)');
        }


        // --- 5. ARREAR TRACKING ---
        console.log('\n--- 5. Arrear Tracking Testing ---');
        // Unlock first
        await axios.post(`${BASE_URL}/exam/semester-control`, {
            department: student.department,
            year: student.year,
            semester: student.semester,
            section: student.section,
            field: 'isLocked',
            value: false
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // Fail student
        await axios.post(`${BASE_URL}/exam/end-sem-marks`, {
            marksData: [{ studentId: student.id, externalMarks: 5 }],
            subjectId: subject.id,
            semester: student.semester
        }, { headers: { Authorization: `Bearer ${facultyToken}` } });

        const arrear = await prisma.arrear.findFirst({
            where: { studentId: student.id, subjectId: subject.id }
        });
        if (arrear && !arrear.isCleared) {
            console.log('✅ Arrear logged correctly for failure');
        }


        // --- 6. PDF GENERATION ---
        console.log('\n--- 6. PDF Generation Testing ---');
        const pdfRes = await axios.get(`${BASE_URL}/exam/grade-sheet?studentId=${student.id}&semester=${student.semester}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            responseType: 'arraybuffer'
        });
        if (pdfRes.status === 200) {
            console.log('✅ PDF Grade Sheet generated successfully');
        }

        console.log('\n🎉 Phase 1 Verification Completed Successfully');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    } finally {
        await cleanupUsers();
        await prisma.$disconnect();
    }
}

runTests();
