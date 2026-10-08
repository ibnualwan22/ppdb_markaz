import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";
import { cekWajibMutasiSakan } from "@/app/lib/mutasi-sakan";


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
    // Hanya untuk yang sudah memiliki riwayat di Dufah sebelumnya
    if (dufahLama) {
      await prisma.santri.updateMany({
        where: { 
          kategori: "BARU",
          riwayat: {
            some: { dufahId: dufahLama.id }
          }
        },
        data: { kategori: "LAMA" }
      });
    }

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
        },
        include: {
          santri: true
        }
      });

      for (const riwayat of riwayatLama) {
        // Cek apakah sudah pernah digenerate untuk dufah baru
        const cekDuplikat = await prisma.riwayatDufah.findUnique({
          where: { santriId_dufahId: { santriId: riwayat.santriId, dufahId: dufahAktif.id } }
        });

        const isKSU = riwayat.santri.kategori === "KSU";

        if (!cekDuplikat) {
          // Logika Siklus 3 Bulan Asrama & Reset Syawal
          const newBulanKe = isTahunBaru ? 1 : riwayat.bulanKe + 1;

          // Cek 3 dufah berturut-turut di sakan yang sama (helper bersama)
          const hasilMutasi = await cekWajibMutasiSakan(riwayat.santriId, dufahAktif.id);

          // Jika BUKAN KSU: Tahun Baru ATAU sakan sama berturut-turut, lemari dicabut (null) agar mutasi.
          // Khusus KSU: lemari SELALU dipertahankan, meskipun Reset Syawal.
          const isMutasiSakan = isKSU ? false : (isTahunBaru || hasilMutasi.wajibMutasi);
          const newLemariId = isMutasiSakan ? null : riwayat.lemariId;
          const newStatus = isMutasiSakan ? "PRE_LIST" : "ASSIGNED";

          await prisma.riwayatDufah.create({
            data: {
              santriId: riwayat.santriId,
              dufahId: dufahAktif.id,
              lemariId: newLemariId,
              status: newStatus,
              isIdCardTaken: false, // Kartu ID berlaku per dufah: tiap dufah baru mulai dari belum ambil
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
        } else if (!isKSU) {
          // Aktivasi ulang: record sudah ada sehingga cekDuplikat melewatinya,
          // tapi santri bisa saja terlanjur ditempatkan di sakan terlarang
          // via jalur lain. Evaluasi ulang: jika saat ini masih di sakan
          // yang wajib ditinggalkan, mutasikan sekarang.
          // (Sengaja tanpa isTahunBaru agar penempatan manual yang sudah
          // benar tidak dibongkar oleh aktivasi ulang.)
          const hasilMutasi = await cekWajibMutasiSakan(riwayat.santriId, dufahAktif.id);
          if (hasilMutasi.wajibMutasi && hasilMutasi.sakanIdLama) {
            const existing = await prisma.riwayatDufah.findUnique({
              where: { santriId_dufahId: { santriId: riwayat.santriId, dufahId: dufahAktif.id } },
              include: { lemari: { include: { kamar: true } } }
            });
            const sakanSekarang = existing?.lemari?.kamar?.sakanId;
            if (existing?.lemariId && sakanSekarang === hasilMutasi.sakanIdLama) {
              await prisma.riwayatDufah.update({
                where: { id: existing.id },
                data: { lemariId: null, status: "PRE_LIST" }
              });
              await prisma.lemari.update({
                where: { id: existing.lemariId },
                data: { isLocked: false }
              });
            }
          }
        }
      }
    }
    await notifySiakadWebhook();

    return NextResponse.json({ 
      message: `${dufahAktif.nama} aktif. Logika batas aktif dan siklus asrama berhasil diterapkan.`,
      data: dufahAktif 
    });
  } catch (error) {
    console.error("Gagal aktivasi dufah:", error);
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}