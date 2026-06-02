const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const santri = await prisma.santri.findFirst({
    select: { id: true, nis: true, nama: true }
  });
  console.log("Santri:", santri);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
