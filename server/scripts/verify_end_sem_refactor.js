const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const instance = axios.create({
    baseURL: 'http://localhost:3000/api',
});

// Admin Token
const adminToken = jwt.sign(
    { id: 1, role: 'ADMIN', username: 'admin' },
    process.env.JWT_SECRET
);

// Faculty Token
const facultyToken = jwt.sign(
    { id: 2, role: 'FACULTY', username: 'faculty1' },
    process.env.JWT_SECRET
);

async function runTests() {
    console.log('--- Verification: End Semester Marks Refactoring ---');
    console.log('Target URL: http://localhost:3000/api');

    try {
        console.log('\n1. Testing Admin Access to End Sem Marks...');
        try {
            const adminRes = await instance.get('/exam/end-sem-marks', {
                headers: { Authorization: `Bearer ${adminToken}` },
                params: { department: 'Computer Science', year: 2, semester: 4, section: 'A', subjectId: 1 }
            });
            console.log('✅ Admin Access: SUCCESS (Status 200)');
        } catch (e) {
            console.log('⚠️ Admin Access Note: ' + (e.response?.status === 200 ? 'SUCCESS' : 'Status ' + e.response?.status + ' - ' + (e.response?.data?.message || e.message)));
        }

        console.log('\n2. Testing Faculty Access to End Sem Marks (Should FAIL)...');
        try {
            await instance.get('/exam/end-sem-marks', {
                headers: { Authorization: `Bearer ${facultyToken}` }
            });
            console.log('❌ Faculty Access: FAILED (Should have been blocked)');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Faculty Access Blocked: SUCCESS (Status 403)');
            } else {
                console.log('❌ Faculty Access Blocked: FAILED (Status ' + error.response?.status + ')');
            }
        }

        console.log('\n3. Testing Faculty Access to Results (Before Publish)...');
        try {
            await instance.get('/exam/faculty-results', {
                headers: { Authorization: `Bearer ${facultyToken}` },
                params: { department: 'GEN', year: 1, semester: 1, section: 'A', subjectId: 1 }
            });
            console.log('❌ Faculty Results before Publish: FAILED (Should be blocked)');
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ Faculty Results before Publish Blocked: SUCCESS (Status 403)');
            } else {
                console.log('❌ Faculty Results before Publish Blocked: FAILED (Status ' + error.response?.status + ')');
            }
        }

        console.log('\n4. Testing Admin Publish Result...');
        await instance.post('/exam/semester-control', {
            department: 'Computer Science', year: 2, semester: 4, section: 'A',
            field: 'isPublished', value: true
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('✅ Admin Publish: SUCCESS');

        console.log('\n5. Testing Faculty Access to Results (After Publish)...');
        const resultsRes = await instance.get('/exam/faculty-results', {
            headers: { Authorization: `Bearer ${facultyToken}` },
            params: { department: 'Computer Science', year: 2, semester: 4, section: 'A', subjectId: 1 }
        });
        console.log('✅ Faculty Results after Publish: SUCCESS (Status 200)');

    } catch (error) {
        console.error('Unexpected Error:', error.response?.data || error.message);
    }
}

runTests();
