import type { Prisma } from "@prisma/client";
import { cekWajibMutasiSakan } from "@/app/lib/mutasi-sakan";

export interface RolloverHasil {
  dufahId: number;
  namaDufah: string;
  dufahLamaId: number | null;
  /** Santri non-KSU yang di-CO (batasAktifDufah < id baru). */
  coCount: number;
  /** Santri BARU -> LAMA. */
  flipCount: number;
  /** Baris RiwayatDufah baru yang dibuat untuk dufah baru. */
  riwayatBaru: number;
  /** Di antaranya yang mutasi sakan (lemari dicabut -> PRE_LIST). */
  mutasiCount: number;
  /** Santri isAktif=true setelah rollover. */
  santriAktif: number;
}

/**
 * Logika rollover dufah — SATU eksekutor yang dipakai baik oleh endpoint
 * Bawwabah (POST /api/bawwabah/rollover) maupun tombol "Set Aktif" lama
 * (PATCH /api/dufah/[id]/active), supaya keduanya tidak bisa menyimpang.
 *
 * HARUS dipanggil di dalam `prisma.$transaction` oleh pemanggil — semua
 * baca/tulis memakai client transaksi (tx) yang diberikan, kecuali
 * `cekWajibMutasiSakan` yang memakai client global Prisma: helper itu
 * hanya membaca RiwayatDufah histori (dufahId < baru + lemari) yang tidak
 * pernah ditulis oleh transaksi ini sebelum loop migrasi, jadi bacaannya
 * sama dari dalam maupun luar transaksi.
 *
 * Langkah (sama persis dengan PATCH lama):
 *   1. cari dufah lama (yang sedang aktif)
 *   2. matikan semua dufah
 *   3. nyalakan dufah baru (+ tetapkan isTahunBaru final dari argumen)
 *   4. auto-CO santri non-KSU yang batasAktifDufah-nya habis
 *   5. flip kategori BARU -> LAMA (yang punya riwayat di dufah lama)
 *   6. migrasi auto-continue per santri (duplikat dijaga unique
 *      santriId+dufahId; cabang aktivasi-ulang mengevaluasi ulang mutasi
 *      tanpa isTahunBaru agar penempatan manual tidak dibongkar)
 *
 * TIDAK memanggil webhook — itu tugas pemanggil, SETELAH transaksi komit.
 */
export async function jalankanRolloverDufah(
  tx: Prisma.TransactionClient,
  args: { dufahIdBaru: number; isTahunBaru: boolean }
): Promise<RolloverHasil> {
  const { dufahIdBaru, isTahunBaru } = args;

  // 1. Cari Duf'ah Lama
  const dufahLama = await tx.dufah.findFirst({ where: { isActive: true } });

  // 2. Matikan semua Duf'ah
  await tx.dufah.updateMany({ data: { isActive: false } });

  // 3. Aktifkan Duf'ah yang baru dipilih (+ isTahunBaru final dari pemanggil)
  const dufahAktif = await tx.dufah.update({
    where: { id: dufahIdBaru },
    data: { isActive: true, isTahunBaru },
  });

  // 4. Auto-CO: santri yang batasAktifnya KURANG dari dufah baru.
  //    Pengecualian: KSU tidak akan pernah habis.
  const co = await tx.santri.updateMany({
    where: {
      batasAktifDufah: { lt: dufahAktif.id },
      kategori: { not: "KSU" },
    },
    data: {
      isAktif: false, // Auto-CO
    },
  });

  // 5. Ubah kategori BARU menjadi LAMA karena sudah berganti bulan.
  //    Hanya untuk yang sudah memiliki riwayat di Dufah sebelumnya.
  let flipCount = 0;
  if (dufahLama) {
    const flip = await tx.santri.updateMany({
      where: {
        kategori: "BARU",
        riwayat: {
          some: { dufahId: dufahLama.id },
        },
      },
      data: { kategori: "LAMA" },
    });
    flipCount = flip.count;
  }

  // 6. Migrasi Otomatis (Auto-Continue) untuk Santri Aktif (Langganan
  //    Masih Ada) atau KSU.
  let riwayatBaru = 0;
  let mutasiCount = 0;
  if (dufahLama) {
    const riwayatLama = await tx.riwayatDufah.findMany({
      where: {
        dufahId: dufahLama.id,
        santri: {
          OR: [
            { batasAktifDufah: { gte: dufahAktif.id }, isAktif: true },
            { kategori: "KSU", isAktif: true },
          ],
        },
      },
      include: {
        santri: true,
      },
    });

    for (const riwayat of riwayatLama) {
      // Cek apakah sudah pernah digenerate untuk dufah baru
      const cekDuplikat = await tx.riwayatDufah.findUnique({
        where: {
          santriId_dufahId: { santriId: riwayat.santriId, dufahId: dufahAktif.id },
        },
      });

      const isKSU = riwayat.santri.kategori === "KSU";

      if (!cekDuplikat) {
        // Logika Siklus 3 Bulan Asrama & Reset Syawal
        const newBulanKe = isTahunBaru ? 1 : riwayat.bulanKe + 1;

        // Cek 3 dufah berturut-turut di sakan yang sama (helper bersama)
        const hasilMutasi = await cekWajibMutasiSakan(riwayat.santriId, dufahAktif.id);

        // Jika BUKAN KSU: Tahun Baru ATAU sakan sama berturut-turut, lemari dicabut (null) agar mutasi.
        // Khusus KSU: lemari SELALU dipertahankan, meskipun Reset Syawal.
        const isMutasiSakan = isKSU ? false : isTahunBaru || hasilMutasi.wajibMutasi;
        const newLemariId = isMutasiSakan ? null : riwayat.lemariId;
        const newStatus = isMutasiSakan ? "PRE_LIST" : "ASSIGNED";

        await tx.riwayatDufah.create({
          data: {
            santriId: riwayat.santriId,
            dufahId: dufahAktif.id,
            lemariId: newLemariId,
            status: newStatus,
            isIdCardTaken: false, // Kartu ID berlaku per dufah: tiap dufah baru mulai dari belum ambil
            bulanKe: newBulanKe,
          },
        });
        riwayatBaru++;
        if (isMutasiSakan) mutasiCount++;

        // Bebaskan kunci lemari yang lama jika mutasi sakan
        if (isMutasiSakan && riwayat.lemariId) {
          await tx.lemari.update({
            where: { id: riwayat.lemariId },
            data: { isLocked: false },
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
          const existing = await tx.riwayatDufah.findUnique({
            where: {
              santriId_dufahId: { santriId: riwayat.santriId, dufahId: dufahAktif.id },
            },
            include: { lemari: { include: { kamar: true } } },
          });
          const sakanSekarang = existing?.lemari?.kamar?.sakanId;
          if (existing?.lemariId && sakanSekarang === hasilMutasi.sakanIdLama) {
            await tx.riwayatDufah.update({
              where: { id: existing.id },
              data: { lemariId: null, status: "PRE_LIST" },
            });
            await tx.lemari.update({
              where: { id: existing.lemariId },
              data: { isLocked: false },
            });
            mutasiCount++;
          }
        }
      }
    }
  }

  const santriAktif = await tx.santri.count({ where: { isAktif: true } });

  return {
    dufahId: dufahAktif.id,
    namaDufah: dufahAktif.nama,
    dufahLamaId: dufahLama ? dufahLama.id : null,
    coCount: co.count,
    flipCount,
    riwayatBaru,
    mutasiCount,
    santriAktif,
  };
}
