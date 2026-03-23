const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActivityLogs() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 50,
    include: { performer: true }
  });
  console.log('Recent Activity Logs:');
  logs.forEach(log => {
    console.log(`[${log.timestamp.toISOString()}] ${log.action}: ${log.description} (by ${log.performer.username})`);
  });
}

checkActivityLogs()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
