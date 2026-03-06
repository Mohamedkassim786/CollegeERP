const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Finding anomalous marks (rawExternal100 > 60) ---');
    const anomalies = await prisma.externalMark.findMany({
        where: {
            rawExternal100: { gt: 60 }
        },
        include: {
            subject: true
        }
    });
    console.log(JSON.stringify(anomalies, null, 2));

    console.log('\n--- Checking Subject Dummy Mappings for anomalous marks ---');
    const mappingAnomalies = await prisma.subjectDummyMapping.findMany({
        where: {
            marks: { gt: 60 }
        }
    });
    console.log(JSON.stringify(mappingAnomalies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
