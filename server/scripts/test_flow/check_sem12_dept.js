const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('Sem 1/2 students dept:', await prisma.student.findMany({where:{semester:{lte:2}}, select:{department:true}, distinct:['department']}));
}
main().finally(()=>prisma.$disconnect());
