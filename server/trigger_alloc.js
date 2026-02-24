
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerAllocation() {
    try {
        const session = await prisma.examSession.findFirst({
            include: { subjects: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!session) {
            console.log("No session found!");
            return;
        }

        console.log(`Triggering allocation for Session: ${session.examName} (ID: ${session.id})`);

        const halls = await prisma.hall.findMany({ where: { isActive: true } });
        const hallIds = halls.map(h => h.id);

        if (hallIds.length === 0) {
            console.log("No active halls found!");
            return;
        }

        // Mocking req/res for the controller call
        const req = {
            body: {
                sessionId: session.id,
                hallIds: hallIds
            }
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.data = data;
                console.log("Response:", data);
            }
        };

        const { generateAllocations } = require('./controllers/hallAllocationController');
        await generateAllocations(req, res);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

triggerAllocation();
