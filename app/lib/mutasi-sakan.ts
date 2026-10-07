import prisma from "@/lib/prisma";

export interface HasilCekMutasi {
  wajibMutasi: boolean;
  sakanIdLama: string | null;
  namaSakanLama: string | null;
}

const TIDAK_WAJIB: HasilCekMutasi = {
  wajibMutasi: false,
  sakanIdLama: null,
  namaSakanLama: null,
};

/**
 * Cek aturan mutasi wajib: santri yang 3 dufah BERTURUT-TURUT berada di
 * sakan yang sama wajib pindah ke sakan lain.
 *
 * Syarat ketat (agar tidak salah tendang):
 * - Tepat 3 riwayat SEBELUM dufahIdBaru, dengan nomor dufah berurutan
 *   (dufahIdBaru-1, dufahIdBaru-2, dufahIdBaru-3). Riwayat yang bolong
 *   (santri sempat nonaktif) tidak dihitung sebagai streak.
 * - Ketiganya harus sudah ditempati (lemariId tidak null).
 * - Ketiganya harus di sakanId yang sama.
 */
export async function cekWajibMutasiSakan(
  santriId: string,
  dufahIdBaru: number
): Promise<HasilCekMutasi> {
  const tigaTerakhir = await prisma.riwayatDufah.findMany({
    where: {
      santriId,
      lemariId: { not: null },
      dufahId: { lt: dufahIdBaru, gte: dufahIdBaru - 3 },
    },
    orderBy: { dufahId: "desc" },
    include: { lemari: { include: { kamar: { include: { sakan: true } } } } },
  });

  if (tigaTerakhir.length !== 3) return TIDAK_WAJIB;

  // Pastikan nomor dufah benar-benar berurutan, bukan sekadar 3 terakhir
  const ids = tigaTerakhir.map((r) => r.dufahId);
  if (ids[0] !== dufahIdBaru - 1 || ids[1] !== dufahIdBaru - 2 || ids[2] !== dufahIdBaru - 3) {
    return TIDAK_WAJIB;
  }

  const sakanIds = tigaTerakhir
    .map((r) => r.lemari?.kamar?.sakanId)
    .filter((id): id is string => !!id);
  if (sakanIds.length !== 3) return TIDAK_WAJIB;

  const semuaSama = sakanIds.every((id) => id === sakanIds[0]);
  if (!semuaSama) return TIDAK_WAJIB;

  return {
    wajibMutasi: true,
    sakanIdLama: sakanIds[0],
    namaSakanLama: tigaTerakhir[0].lemari?.kamar?.sakan?.nama ?? null,
  };
}
