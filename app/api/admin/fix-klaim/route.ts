import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 1. Cari semua transaksi PENDING yang dufahTujuanId-nya <= batasAktifDufah santri
    const transaksiPending = await prisma.transaksiPendaftaran.findMany({
      where: {
        statusPembayaran: "PENDING",
      },
      include: {
        santri: true
      }
    });

    const transaksiToFix = transaksiPending.filter(t => 
      t.dufahTujuanId !== null && 
      t.santri.batasAktifDufah !== null && 
      t.santri.batasAktifDufah >= t.dufahTujuanId
    );

    const results: any[] = [];

    // 2. Perbaiki satu per satu
    for (const t of transaksiToFix) {
      await prisma.$transaction(async (tx) => {
        // Update transaksi
        const updatedTx = await tx.transaksiPendaftaran.update({
          where: { id: t.id },
          data: {
            totalTagihan: 0,
            statusPembayaran: "KLAIM_PAKET"
          }
        });

        // Update riwayat dufah yang bersangkutan agar lunas
        const updatedRiwayat = await tx.riwayatDufah.updateMany({
          where: {
            santriId: t.santriId,
            dufahId: t.dufahTujuanId!
          },
          data: {
            isLunas: true
          }
        });

        results.push({
          santri: t.santri.nama,
          transaksiId: t.id,
          dufahTujuan: t.dufahTujuanId,
          riwayatDiupdate: updatedRiwayat.count
        });
      });
    }

    return NextResponse.json({
      message: `Berhasil memperbaiki ${results.length} data pendaftaran!`,
      fixedData: results
    });

  } catch (error: any) {
    console.error("Error fixing klaim:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
