import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
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

    const results = transaksiToFix.map(t => ({
      namaSantri: t.santri.nama,
      nis: t.santri.nis,
      dufahTujuan: t.dufahTujuanId,
      batasAktifSantri: t.santri.batasAktifDufah,
      program: t.program.nama,
      durasiBulan: t.program.durasiBulan,
      tagihanSaatIni: t.totalTagihan,
      statusSaatIni: t.statusPembayaran,
      statusAkanMenjadi: "KLAIM_PAKET (Rp 0)"
    }));

    return NextResponse.json({
      message: "BERIKUT ADALAH HASIL READ-ONLY (SIMULASI). DATA DI DATABASE BELUM BERUBAH.",
      totalTransaksiPending: transaksiPending.length,
      totalTerdeteksiKlaimPaket: transaksiToFix.length,
      detailSantri: results
    });

  } catch (error: any) {
    console.error("Error checking klaim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
