import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
  
  const allActiveSantri = await prisma.santri.findMany({
    where: { isAktif: true },
    include: { riwayat: { where: { dufahId: dufahAktif.id } } }
  });

  const ghosts = allActiveSantri.filter(s => {
    if (s.riwayat.length === 0) return true;
    if (s.riwayat[0].status === "CHECKED_OUT") return true;
    return false;
  });

  console.log("Ghosts:", ghosts.map(g => g.nama));
}
main().catch(console.error).finally(() => prisma.$disconnect())
