const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = 'Admin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
        { username: 'principal', role: 'PRINCIPAL', fullName: 'Principal User' },
        { username: 'hod_cse', role: 'HOD', fullName: 'HOD CSE', department: 'CSE' },
        { username: 'hod_mech', role: 'HOD', fullName: 'HOD MECH', department: 'MECH' },
        { username: 'hod_ece', role: 'HOD', fullName: 'HOD ECE', department: 'ECE' },
        { username: 'hod_eee', role: 'HOD', fullName: 'HOD EEE', department: 'EEE' },
        { username: 'hod_civil', role: 'HOD', fullName: 'HOD CIVIL', department: 'CIVIL' },
        { username: 'chief_secretary', role: 'CHIEF_SECRETARY', fullName: 'Chief Secretary' },
        { username: 'coe', role: 'COE', fullName: 'COE User' },
        { username: 'admin', role: 'ADMIN', fullName: 'System Administrator' }
    ];

    console.log('--- Seeding Roles ---');
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: { role: u.role, fullName: u.fullName, department: u.department || null },
            create: {
                username: u.username,
                password: hashedPassword,
                role: u.role,
                fullName: u.fullName,
                department: u.department || null
            }
        });
        console.log(`User ${u.username} (${u.role}) ensured. Password: ${password}`);
    }
    console.log('--- Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
