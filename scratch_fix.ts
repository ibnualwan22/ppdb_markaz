import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Find active santris whose current riwayat is CHECKED_OUT
  const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
  if (!dufahAktif) return;

  const affectedRiwayats = await prisma.riwayatDufah.findMany({
    where: {
      dufahId: dufahAktif.id,
      status: "CHECKED_OUT",
      santri: {
        isAktif: true
      }
    },
    include: { santri: true }
  });

  console.log(`Found ${affectedRiwayats.length} affected santris.`);

  for (const r of affectedRiwayats) {
    const newStatus = r.lemariId ? "ASSIGNED" : "PRE_LIST";
    await prisma.riwayatDufah.update({
      where: { id: r.id },
      data: { status: newStatus }
    });

    if (r.santri.batasAktifDufah < dufahAktif.id) {
       await prisma.santri.update({
         where: { id: r.santriId },
         data: { batasAktifDufah: dufahAktif.id }
       });
    }
    console.log(`Fixed ${r.santri.nama}: status -> ${newStatus}, batasAktifDufah restored to ${dufahAktif.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
