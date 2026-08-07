import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const activeDufah = await prisma.dufah.findFirst({ where: { isActive: true } });
  if (!activeDufah) {
    console.log("No active dufah");
    return;
  }
  
  // Ambil transaksi dari dufah aktif
  const latestTransactions = await prisma.transaksiPendaftaran.findMany({
    where: { 
      dufahTujuanId: activeDufah.id,
      statusPembayaran: { in: ['PAID', 'KSU_GRATIS', 'KLAIM_PAKET'] }
    },
    include: {
      program: true,
      santri: {
        include: {
          transaksi: {
            where: {
              dufahTujuanId: { not: activeDufah.id },
              statusPembayaran: { in: ['PAID', 'KSU_GRATIS', 'KLAIM_PAKET'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { program: true }
          }
        }
      }
    }
  });

  const changedStudents = latestTransactions.filter(trx => {
    const currentProgram = trx.program.kategoriProgram;
    const oldTrx = trx.santri.transaksi[0];
    if (oldTrx) {
      const oldProgram = oldTrx.program.kategoriProgram;
      return currentProgram !== oldProgram;
    }
    return false;
  });

  console.log(`Found ${changedStudents.length} students who changed category`);
  if (changedStudents.length > 0) {
    console.log("Example:", JSON.stringify({
      nama: changedStudents[0].santri.nama,
      oldProgram: changedStudents[0].santri.transaksi[0].program.kategoriProgram,
      newProgram: changedStudents[0].program.kategoriProgram
    }, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
