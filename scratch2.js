const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const santriList = await prisma.santri.findMany({
    where: { nis: { not: null } },
    select: { nis: true },
    take: 10,
    orderBy: { createdAt: 'asc' }
  });
  console.log(santriList);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
