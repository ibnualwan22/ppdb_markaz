import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dufahIdBaru = parseInt(id);

    // 1. Cari Duf'ah Lama
    const dufahLama = await prisma.dufah.findFirst({ where: { isActive: true } });

    // 2. Matikan semua Duf'ah
    await prisma.dufah.updateMany({ data: { isActive: false } });

    // 3. Aktifkan Duf'ah yang baru dipilih
    const dufahAktif = await prisma.dufah.update({
      where: { id: dufahIdBaru },
      data: { isActive: true }
    });

    const isTahunBaru = dufahAktif.isTahunBaru;

    // ==========================================
    // LOGIKA AUTO-CO & SUBSCRIPTION FASE EKSPANSI
    // ==========================================
    
    // 4. Cari santri yang batasAktifnya KURANG dari dufah baru (Masa Langganan Habis)
    //    Pengecualian: KSU tidak akan pernah habis.
    await prisma.santri.updateMany({
      where: {
        batasAktifDufah: { lt: dufahAktif.id },
        kategori: { not: "KSU" }
      },
      data: {
        isAktif: false, // Auto-CO
      }
    });

    // 5. Ubah kategori BARU menjadi LAMA karena sudah berganti bulan
    await prisma.santri.updateMany({
      where: { kategori: "BARU" },
      data: { kategori: "LAMA" }
    });

    // 6. Migrasi Otomatis (Auto-Continue) untuk Santri Aktif (Langganan Masih Ada) atau KSU
    if (dufahLama) {
      // Ambil Riwayat dari bulan lalu
      const riwayatLama = await prisma.riwayatDufah.findMany({
        where: {
          dufahId: dufahLama.id,
          santri: {
            OR: [
              { batasAktifDufah: { gte: dufahAktif.id }, isAktif: true },
              { kategori: "KSU", isAktif: true }
            ]
          }
        }
      });

      for (const riwayat of riwayatLama) {
        // Cek apakah sudah pernah digenerate untuk dufah baru
        const cekDuplikat = await prisma.riwayatDufah.findUnique({
          where: { santriId_dufahId: { santriId: riwayat.santriId, dufahId: dufahAktif.id } }
        });

        if (!cekDuplikat) {
          // Logika Siklus 3 Bulan Asrama & Reset Syawal
          const newBulanKe = isTahunBaru ? 1 : riwayat.bulanKe + 1;
          
          // Jika Tahun Baru ATAU sudah 3 bulan, lemari dicabut (null) agar harus mutasi.
          // Jika tidak, lemari dipertahankan.
          const isMutasiSakan = isTahunBaru || riwayat.bulanKe >= 3;
          const newLemariId = isMutasiSakan ? null : riwayat.lemariId;
          const newStatus = isMutasiSakan ? "PRE_LIST" : "ASSIGNED";

          await prisma.riwayatDufah.create({
            data: {
              santriId: riwayat.santriId,
              dufahId: dufahAktif.id,
              lemariId: newLemariId,
              status: newStatus,
              isIdCardTaken: riwayat.isIdCardTaken, // ID card tidak perlu bikin ulang
              bulanKe: newBulanKe
            }
          });
          
          // Bebaskan kunci lemari yang lama jika mutasi sakan
          if (isMutasiSakan && riwayat.lemariId) {
             await prisma.lemari.update({
                where: { id: riwayat.lemariId },
                data: { isLocked: false }
             });
          }
        }
      }
    }

    return NextResponse.json({ 
      message: `${dufahAktif.nama} aktif. Logika batas aktif dan siklus asrama berhasil diterapkan.`,
      data: dufahAktif 
    });
  } catch (error) {
    console.error("Gagal aktivasi dufah:", error);
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}