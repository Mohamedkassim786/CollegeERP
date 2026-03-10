require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');

const token = jwt.sign(
    { id: 1, username: 'admin', role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

async function testCreate() {
  try {
    const res = await axios.post('http://localhost:3000/api/admin/students', {
        rollNo: "X1225006",
        registerNumber: "912422104006",
        name: "TEST STUDENT 2",
        department: "CSE",
        year: "4",
        section: "A",
        semester: "8",
        regulation: "2021",
        batch: "2021-2025",
        admissionYear: "2021",
        photo: "",
        dateOfBirth: "2000-01-01",
        gender: "MALE",
        bloodGroup: "O+",
        nationality: "Indian",
        phoneNumber: "9876543210",
        email: "test@example.com",
        address: "Test Address",
        city: "Test City",
        district: "Test District",
        state: "Test State",
        pincode: "600000",
        fatherName: "Father",
        fatherPhone: "9876543210",
        motherName: "Mother",
        motherPhone: "9876543210",
        guardianName: "",
        guardianPhone: "",
        status: "ACTIVE"
    }, {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", JSON.stringify(err.response ? err.response.data : err.message, null, 2));
  }
}

testCreate();
