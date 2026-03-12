const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Verification Data Seeding...');

    const departments = [
        { name: 'Computer Science and Engineering', code: 'CSE' },
        { name: 'Electronics and Communication Engineering', code: 'ECE' },
        { name: 'Electrical and Electronics Engineering', code: 'EEE' },
        { name: 'Mechanical Engineering', code: 'MECH' }
    ];

    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Departments
    console.log('--- Creating Departments ---');
    for (const d of departments) {
        await prisma.department.upsert({
            where: { name: d.name },
            update: { code: d.code },
            create: { name: d.name, code: d.code }
        });
    }

    const allDepts = await prisma.department.findMany();

    // Directory Setup for Photos
    const facultyUploadDir = path.join(__dirname, '../../uploads/faculty');
    const studentUploadDir = path.join(__dirname, '../../uploads/students');
    
    if (!fs.existsSync(facultyUploadDir)) fs.mkdirSync(facultyUploadDir, { recursive: true });
    if (!fs.existsSync(studentUploadDir)) fs.mkdirSync(studentUploadDir, { recursive: true });

    // 2. Create Faculty & HODs
    console.log('--- Creating Faculty & HODs ---');
    let facultyCount = 1;
    for (const dept of allDepts) {
        // 1 HOD + 2 Faculty per dept
        for (let i = 1; i <= 3; i++) {
            const isHOD = i === 1;
            const staffId = `STF${dept.code}${i}`;
            const fullName = `${isHOD ? 'Dr.' : 'Mr/Ms.'} ${dept.code} Staff ${i}`;
            const photoName = `faculty_${staffId}.jpg`;
            
            // Create placeholder photo
            fs.writeFileSync(path.join(facultyUploadDir, photoName), 'FAKE_IMAGE_DATA');

            const faculty = await prisma.faculty.upsert({
                where: { staffId: staffId },
                update: {
                    fullName,
                    role: isHOD ? 'HOD' : 'FACULTY',
                    department: dept.name,
                    departmentId: dept.id,
                    photo: photoName,
                    designation: isHOD ? 'Professor & Head' : 'Assistant Professor',
                    qualification: isHOD ? 'Ph.D' : 'M.E / M.Tech',
                    phone: `987654321${facultyCount}`,
                    email: `${staffId.toLowerCase()}@miet.edu`,
                    dateOfBirth: '1980-01-01',
                    gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
                    bloodGroup: 'B+',
                    address: 'MIET Campus, Trichy',
                    isActive: true
                },
                create: {
                    staffId,
                    password: hashedPassword,
                    fullName,
                    role: isHOD ? 'HOD' : 'FACULTY',
                    department: dept.name,
                    departmentId: dept.id,
                    photo: photoName,
                    designation: isHOD ? 'Professor & Head' : 'Assistant Professor',
                    qualification: isHOD ? 'Ph.D' : 'M.E / M.Tech',
                    phone: `987654321${facultyCount}`,
                    email: `${staffId.toLowerCase()}@miet.edu`,
                    dateOfBirth: '1980-01-01',
                    gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
                    bloodGroup: 'B+',
                    address: 'MIET Campus, Trichy',
                    isActive: true
                }
            });

            // If HOD, update department record
            if (isHOD) {
                await prisma.department.update({
                    where: { id: dept.id },
                    data: { hodId: faculty.id, hodName: faculty.fullName }
                });
            }
            facultyCount++;
        }
    }

    // 3. Create Students
    console.log('--- Creating Students ---');
    let studentCount = 1;
    for (const dept of allDepts) {
        // Years 2, 3, 4
        for (let year = 2; year <= 4; year++) {
            // 2 Students per year per dept (total 4*3*2 = 24 students)
            for (let i = 1; i <= 2; i++) {
                const rollNo = `2021${dept.code}${year}${i}`;
                const name = `${dept.code} Student ${year}${i}`;
                const photoName = `student_${rollNo}.jpg`;
                
                // Create placeholder photo
                fs.writeFileSync(path.join(studentUploadDir, photoName), 'FAKE_IMAGE_DATA');

                await prisma.student.upsert({
                    where: { rollNo: rollNo },
                    update: {
                        name,
                        department: dept.name,
                        departmentId: dept.id,
                        year: year,
                        section: 'A',
                        semester: year * 2 - 1,
                        batch: '2021-2025',
                        photo: photoName,
                        dateOfBirth: '2004-05-15',
                        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
                        bloodGroup: 'O+',
                        phoneNumber: `887766554${studentCount}`,
                        email: `${rollNo.toLowerCase()}@miet.edu`,
                        address: 'Trichy Main Road',
                        fatherName: 'Mr. Parent',
                        motherName: 'Mrs. Parent'
                    },
                    create: {
                        rollNo,
                        name,
                        department: dept.name,
                        departmentId: dept.id,
                        year: year,
                        section: 'A',
                        semester: year * 2 - 1,
                        batch: '2021-2025',
                        photo: photoName,
                        dateOfBirth: '2004-05-15',
                        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
                        bloodGroup: 'O+',
                        phoneNumber: `887766554${studentCount}`,
                        email: `${rollNo.toLowerCase()}@miet.edu`,
                        address: 'Trichy Main Road',
                        fatherName: 'Mr. Parent',
                        motherName: 'Mrs. Parent'
                    }
                });
                studentCount++;
            }
        }
    }

    console.log('✅ Verification Data Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
