import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    // Cari Duf'ah yang sedang berjalan (isActive)
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

    if (!dufahAktif) {
      return NextResponse.json([]);
    }

    // Cari juga Duf'ah yang sedang buka pendaftaran (berdasarkan tanggal)
    const now = new Date();
    const allDufahs = await prisma.dufah.findMany();
    const dufahTarget = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    // Kumpulkan ID dufah yang relevan (hanya yang AKTIF)
    const relevantDufahIds = [dufahAktif.id];

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahAktif.id } },
      orderBy: { id: 'desc' }
    });

    // Tarik semua data riwayat yang butuh kamar dari dufah aktif DAN dufah target
    const antrean = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: { in: relevantDufahIds },
        lemariId: null,
        santri: { isAktif: true },
      },
      include: {
        santri: {
          select: {
            id: true, nama: true, kategori: true, gender: true, nis: true, kabupaten: true,
            program: { select: { kategoriProgram: true } },
          }
        }
      },
      // Urut berdasarkan waktu ACC pembayaran (updatedAt riwayat = saat verifikasi lunas)
      orderBy: { updatedAt: "asc" }
    });

    // Ambil transaksi untuk label program (Reguler/Turats) tiap santri
    const santriIds = antrean.map((r) => r.santriId);
    const daftarTransaksi = santriIds.length > 0 ? await prisma.transaksiPendaftaran.findMany({
      where: { santriId: { in: santriIds } },
      include: { program: { select: { kategoriProgram: true } } },
      orderBy: { createdAt: "desc" },
    }) : [];

    const labelProgram: Record<string, string> = {
      REGULER: "Reguler",
      TUROTS: "Turats",
      "2MINGGU": "2 Minggu",
    };

    function getProgramLabel(santriId: string, kategoriOverride?: string | null): string {
      if (kategoriOverride) return labelProgram[kategoriOverride] || kategoriOverride;
      const trxTujuan = daftarTransaksi.find((t) => t.santriId === santriId && t.dufahTujuanId === dufahAktif.id);
      const trx = trxTujuan || daftarTransaksi.find((t) => t.santriId === santriId);
      const kat = trx?.program?.kategoriProgram;
      return kat ? (labelProgram[kat] || kat) : "-";
    }

    // Tempelkan keterangan histori kamar/sakan sebelumnya
    const antreanDenganHistori = await Promise.all(antrean.map(async (row) => {
      let keteranganSakanLama = "";
      if (dufahLama) {
        const historiLama = await prisma.riwayatDufah.findFirst({
          where: {
            santriId: row.santriId,
            dufahId: dufahLama.id,
            lemariId: { not: null }
          },
          include: {
            lemari: {
              include: {
                kamar: {
                  include: {
                    sakan: true
                  }
                }
              }
            }
          }
        });

        if (historiLama?.lemari) {
          keteranganSakanLama = `${historiLama.lemari.kamar.sakan.nama} (Kamar ${historiLama.lemari.kamar.nama})`;
        }
      }

      return {
        ...row,
        keteranganSakanLama,
        programLabel: getProgramLabel(row.santriId, row.santri.program?.kategoriProgram),
      };
    }));

    return NextResponse.json(antreanDenganHistori);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data antrean" }, { status: 500 });
  }
}