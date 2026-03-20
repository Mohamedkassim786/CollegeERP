const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.department.findMany().then(d => {
    d.forEach(x => console.log(x.name + ':', x.years));
}).catch(e => console.error(e)).finally(() => prisma.$disconnect());
