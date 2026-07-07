const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const santri = await prisma.santri.findFirst({
    where: { nama: { contains: "Roudoh Hasibuan" } },
    include: {
      riwayat: {
        include: {
          dufah: true
        }
      }
    }
  });

  const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

  console.log("Dufah Aktif ID:", dufahAktif?.id);
  console.log("Santri isAktif:", santri?.isAktif);
  if (santri) {
     const riwayatLokal = santri.riwayat.find(r => r.dufahId === dufahAktif?.id);
     console.log("Riwayat di bulan aktif:", riwayatLokal);
     console.log("isLunas:", riwayatLokal?.isLunas);
  }
}

check();
