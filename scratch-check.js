const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transaksiPending = await prisma.transaksiPendaftaran.findMany({
    where: {
      statusPembayaran: "PENDING",
    },
    include: {
      santri: true,
      program: true
    }
  });

  const transaksiToFix = transaksiPending.filter(t => 
    t.dufahTujuanId !== null && 
    t.santri.batasAktifDufah !== null && 
    t.santri.batasAktifDufah >= t.dufahTujuanId
  );

  console.log("Total Transaksi PENDING:", transaksiPending.length);
  console.log("Total yang terdeteksi salah tagih (Klaim Paket):", transaksiToFix.length);

  for (let i = 0; i < transaksiToFix.length; i++) {
    const t = transaksiToFix[i];
    console.log(`\nSantri: ${t.santri.nama} (NIS: ${t.santri.nis})`);
    console.log(`- Dufah Tujuan: ${t.dufahTujuanId}`);
    console.log(`- Batas Aktif Santri: ${t.santri.batasAktifDufah}`);
    console.log(`- Program: ${t.program.nama} (Durasi: ${t.program.durasiBulan} Bulan)`);
    console.log(`- Tagihan Saat Ini: Rp ${t.totalTagihan}`);
    console.log(`- Status Akan Diubah Menjadi: KLAIM_PAKET (Rp 0)`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
