const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:3000/api';
const STUDENT_COUNT = 200; // Adjusted for timing
const CHUNK_SIZE = 50;

async function runPerformanceTest() {
    console.log(`🚀 Starting Performance Test with ${STUDENT_COUNT} students...`);

    try {
        // 1. Setup - Create bulk students and test user
        const TEST_PASSWORD = 'testpassword123';
        const HASHED_PASSWORD = bcrypt.hashSync(TEST_PASSWORD, 10);

        await prisma.user.upsert({
            where: { username: 'perf_admin' },
            update: { password: HASHED_PASSWORD, role: 'ADMIN' },
            create: { username: 'perf_admin', password: HASHED_PASSWORD, role: 'ADMIN', fullName: 'Perf Admin' }
        });

        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, { username: 'perf_admin', password: TEST_PASSWORD });
        const token = adminLogin.data.accessToken;

        console.log('Generating students...');
        for (let i = 0; i < STUDENT_COUNT; i += CHUNK_SIZE) {
            const students = Array.from({ length: Math.min(CHUNK_SIZE, STUDENT_COUNT - i) }).map((_, j) => ({
                registerNumber: `PERF_${i + j}_${Date.now()}`, // Unique reg number
                name: `Stress Student ${i + j}`,
                semester: 1,
                year: 1,
                department: 'PERF',
                section: 'A'
            }));
            await prisma.student.createMany({ data: students, skipDuplicates: true });
        }

        const dbStudents = await prisma.student.findMany({ select: { id: true }, where: { department: 'PERF' } });
        const studentIds = dbStudents.map(s => s.id);

        // 2. Stress GPA Calculation
        console.log('Starting parallel GPA calculations...');
        const startTime = Date.now();

        const BATCH_SIZE = 10;
        for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
            const batch = studentIds.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(id =>
                axios.post(`${BASE_URL}/exam/calculate-gpa`, { studentId: id, semester: 1 }, { headers: { Authorization: `Bearer ${token}` } })
            ));
            process.stdout.write(`\rProgress: ${i + batch.length}/${studentIds.length}`);
        }

        const duration = (Date.now() - startTime) / 1000;
        console.log(`\n✅ Completed ${studentIds.length} GPA calculations in ${duration} seconds`);

        // 3. Cleanup
        console.log('Cleaning up performance test data...');
        await prisma.student.deleteMany({ where: { department: 'PERF' } });
        await prisma.user.delete({ where: { username: 'perf_admin' } });

        console.log('🎉 Performance Test Completed Successfully');
    } catch (error) {
        console.error('❌ Performance test failed:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

runPerformanceTest();
