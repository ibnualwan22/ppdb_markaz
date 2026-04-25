import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newPermissions = [
  // Hak Akses Notifikasi
  { name: 'receive_notif_pendaftaran_baru', description: 'Menerima notifikasi pendaftaran lunas' },
  { name: 'receive_notif_plot_asrama', description: 'Menerima notifikasi plotting asrama selesai' },
  { name: 'receive_notif_status_santri', description: 'Menerima notifikasi perubahan status santri (Cuti/Check Out)' },
  { name: 'receive_notif_idcard', description: 'Menerima notifikasi pencetakan ID Card' },
  
  // Hak Akses Keuangan & Program
  { name: 'view_keuangan', description: 'Melihat dashboard dan riwayat pendaftaran meja keuangan' },
  { name: 'verify_pendaftaran', description: 'Melakukan verifikasi pembayaran santri' },
  { name: 'bypass_ksu', description: 'Mendaftarkan santri via jalur gratis (KSU)' },
  { name: 'manage_program', description: 'Menambah dan mengedit Program / Biaya Pendaftaran' },
  { name: 'export_laporan_keuangan', description: 'Mengunduh laporan keuangan' },
  
  // Hak Akses Log Aktivitas
  { name: 'view_activity_log', description: 'Melihat halaman Log Aktivitas (Audit Trail)' },
];

async function main() {
  console.log('Start seeding new permissions...');

  for (const perm of newPermissions) {
    const exists = await prisma.permission.findUnique({
      where: { namaAksi: perm.name }
    });

    if (!exists) {
      await prisma.permission.create({
        data: {
          namaAksi: perm.name,
          deskripsi: perm.description
        }
      });
      console.log(`Created permission: ${perm.name}`);
    } else {
      console.log(`Permission already exists: ${perm.name}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
