const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
});

const token = jwt.sign(
    { id: 1, role: 'ADMIN', username: 'admin' },
    process.env.JWT_SECRET || 'your_secret_key'
);

instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

async function test() {
    try {
        console.log('--- Testing Create Staff ---');
        const createRes = await instance.post('/external/admin/staff', {
            username: 'tester_staff',
            password: 'password123',
            fullName: 'Test Staff Member'
        });
        console.log('Create Response:', createRes.data);
        const staffId = createRes.data.user.id;

        console.log('\n--- Testing Get Staff ---');
        const getRes = await instance.get('/external/admin/staff');
        console.log('Staff Count:', getRes.data.length);
        const found = getRes.data.find(s => s.id === staffId);
        console.log('Staff Found in List:', found ? 'YES' : 'NO');

        console.log('\n--- Testing Delete Staff ---');
        const deleteRes = await instance.delete(`/external/admin/staff/${staffId}`);
        console.log('Delete Response:', deleteRes.data);

        console.log('\n--- Verification Finished ---');
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

test();
