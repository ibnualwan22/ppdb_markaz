import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Dapatkan dufah aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json([]); 
    }

    // 2. Ambil semua Santri yang memiliki riwayat di bulan aktif
    const dataSantri = await prisma.santri.findMany({
      where: {
        riwayat: { some: { dufahId: dufahAktif.id } }
      },
      include: {
        riwayat: {
          orderBy: { dufahId: 'desc' },
          include: {
            dufah: true,
            lemari: { include: { kamar: { include: { sakan: true } } } }
          }
        },
        transaksi: {
          where: { statusPembayaran: { in: ["PAID", "KSU_GRATIS", "KLAIM_PAKET"] } },
          include: { program: true }
        }
      }
    });

    const dataMutasi: any[] = [];

    // Fungsi bantu untuk mendapatkan kategori program lewat TransaksiPendaftaran
    function getKategoriForDufah(santri: any, dufahId: number) {
      const trx = santri.transaksi.find((t: any) => t.dufahTujuanId === dufahId);
      return trx ? trx.program.kategoriProgram : "TIDAK KETEMU";
    }

    // 3. Evaluasi perubahan kategori
    for (const santri of dataSantri) {
      if (santri.kategori === "KSU") continue; // KSU biasanya tidak pindah/ganti

      const currentRiwayat = santri.riwayat.find((r: any) => r.dufahId === dufahAktif.id);
      const previousRiwayatList = santri.riwayat.filter((r: any) => r.dufahId < dufahAktif.id);

      if (!currentRiwayat || previousRiwayatList.length === 0) continue;

      const prevRiwayat = previousRiwayatList[0]; // Riwayat terdekat sebelum dufah aktif

      const currentProgram = getKategoriForDufah(santri, dufahAktif.id);
      const oldProgram = getKategoriForDufah(santri, prevRiwayat.dufahId);

      // Jika program ditemukan di kedua tempat dan BERBEDA, maka santri pindah kategori
      if (currentProgram !== "TIDAK KETEMU" && oldProgram !== "TIDAK KETEMU" && currentProgram !== oldProgram) {
        
        // Buat riwayat lengkap untuk modal (format di reverse agar dari lama ke baru)
        const riwayatDufah = santri.riwayat.map((r: any) => ({
          dufah: r.dufah.nama,
          sakan: r.lemari?.kamar.sakan.nama || "Antrean",
          kamar: r.lemari?.kamar.nama || "-",
          lemari: r.lemari?.nomor || "-",
          kategoriProgram: getKategoriForDufah(santri, r.dufahId)
        })).reverse();

        const sakanSaatIniId = currentRiwayat.lemari?.kamar.sakanId || "PRE_LIST";
        const sakanLamaId = prevRiwayat.lemari?.kamar.sakanId || null;

        dataMutasi.push({
          santriId: santri.id,
          riwayatId: currentRiwayat.id,
          nama: santri.nama,
          nis: santri.nis,
          gender: santri.gender,
          programLama: oldProgram,
          programBaru: currentProgram,
          sakanLama: prevRiwayat.lemari?.kamar.sakan.nama || "-",
          sakanSaatIni: currentRiwayat.lemari?.kamar.sakan.nama || "Antrean (PRE_LIST)",
          kamarSaatIni: currentRiwayat.lemari?.kamar.nama || "-",
          lemariSaatIni: currentRiwayat.lemari?.nomor || "-",
          sudahDimutasi: sakanSaatIniId !== sakanLamaId && sakanSaatIniId !== "PRE_LIST", // bisa disesuaikan apakah PRE_LIST dihitung sudah mutasi
          isAntrean: sakanSaatIniId === "PRE_LIST",
          riwayatDufah
        });
      }
    }

    // Urutkan: yang belum dimutasi di atas
    dataMutasi.sort((a, b) => {
        if (a.isAntrean && !b.isAntrean) return -1;
        if (!a.isAntrean && b.isAntrean) return 1;
        return Number(a.sudahDimutasi) - Number(b.sudahDimutasi);
    });

    return NextResponse.json({
      dufahAktif: dufahAktif.nama,
      daftarMutasi: dataMutasi
    });
  } catch (error) {
    console.error("Gagal get data mutasi:", error);
    return NextResponse.json({ error: "Gagal memuat data mutasi sakan" }, { status: 500 });
  }
}
