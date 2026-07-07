import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Dapatkan dufah aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json([]); 
    }

    // 2. Ambil semua RiwayatDufah di bulan aktif (baik sudah ASSIGNED maupun PRE_LIST)
    const riwayatBulanIni = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: dufahAktif.id,
      },
      include: {
        santri: { select: { id: true, nama: true, nis: true, gender: true, kategori: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } }
      },
    });

    const dataMutasi = [];

    // 3. Looping masing-masing santri
    for (const riwayat of riwayatBulanIni) {
      if (riwayat.santri.kategori === "KSU") continue;

      // Cek 3 riwayat SEBELUM dufah aktif (lt, bukan lte)
      const riwayat3Sebelumnya = await prisma.riwayatDufah.findMany({
        where: {
          santriId: riwayat.santriId,
          lemariId: { not: null },
          dufahId: { lt: dufahAktif.id },
        },
        orderBy: { dufahId: 'desc' },
        take: 3,
        include: {
          dufah: { select: { nama: true } },
          lemari: { include: { kamar: { include: { sakan: true } } } }
        }
      });

      const sakanIds = riwayat3Sebelumnya.map(r => r.lemari?.kamar.sakanId).filter(Boolean);
      const allSameSakan = sakanIds.length === 3 && sakanIds.every(id => id === sakanIds[0]);

      if (!allSameSakan) continue; // 3 dufah sebelumnya TIDAK di sakan yang sama, skip

      // Cek apakah bulan ini masih di sakan yang sama (belum pindah)
      const sakanBulanIni = riwayat.lemari?.kamar.sakanId;
      const masihDiSakanSama = sakanBulanIni === sakanIds[0];

      // Susun riwayat dari terlama ke terbaru (3 sebelumnya + bulan ini)
      const riwayatSebelumnya = riwayat3Sebelumnya.map(r => ({
        dufah: r.dufah.nama,
        sakan: r.lemari?.kamar.sakan.nama,
        kamar: r.lemari?.kamar.nama,
        lemari: r.lemari?.nomor,
      })).reverse(); // terlama dulu

      const riwayatSekarang = {
        dufah: dufahAktif.nama,
        sakan: riwayat.lemari ? riwayat.lemari.kamar.sakan.nama : null,
        kamar: riwayat.lemari ? riwayat.lemari.kamar.nama : null,
        lemari: riwayat.lemari ? riwayat.lemari.nomor : null,
      };

      dataMutasi.push({
        santriId: riwayat.santriId,
        riwayatId: riwayat.id, // ID riwayat untuk assign langsung
        nama: riwayat.santri.nama,
        nis: riwayat.santri.nis,
        gender: riwayat.santri.gender,
        sakanLama: riwayat3Sebelumnya[0].lemari?.kamar.sakan.nama, // Nama sakan 3 bulan terakhir
        sakanSaatIni: riwayat.lemari ? riwayat.lemari.kamar.sakan.nama : "Antrean (PRE_LIST)",
        kamarSaatIni: riwayat.lemari ? riwayat.lemari.kamar.nama : "-",
        lemariSaatIni: riwayat.lemari ? riwayat.lemari.nomor : "-",
        sudahDimutasi: !masihDiSakanSama, // true = sudah pindah ke sakan lain atau belum ditempati
        riwayatDufah: [...riwayatSebelumnya, riwayatSekarang],
      });
    }

    // Urutkan: yang belum dimutasi (masih di sakan sama) di atas
    dataMutasi.sort((a, b) => Number(a.sudahDimutasi) - Number(b.sudahDimutasi));

    return NextResponse.json({
      dufahAktif: dufahAktif.nama,
      daftarMutasi: dataMutasi
    });
  } catch (error) {
    console.error("Gagal get data mutasi:", error);
    return NextResponse.json({ error: "Gagal memuat data mutasi sakan" }, { status: 500 });
  }
}
