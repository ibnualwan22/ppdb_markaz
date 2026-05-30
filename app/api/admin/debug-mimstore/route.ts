import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
  if (!dufahAktif) return NextResponse.json({});

  const data = await prisma.riwayatDufah.findMany({
    where: { dufahId: dufahAktif.id, isLunas: true, status: { not: "CHECKED_OUT" } },
    include: { santri: true }
  });

  const transaksiList = await prisma.transaksiPendaftaran.findMany({
    where: {
      dufahTujuanId: dufahAktif.id,
      santriId: { in: data.map(d => d.santri.id) },
      statusPembayaran: { in: ["PAID", "KSU_GRATIS", "KLAIM_PAKET"] }
    },
    include: { program: true }
  });

  const debug = data.map(d => {
    const txs = transaksiList.filter(t => t.santriId === d.santri.id && t.dufahTujuanId === d.dufahId);
    let tx = null;
    let isBeli = true;
    if (txs.length > 0) {
      tx = txs.sort((a, b) => b.id.localeCompare(a.id))[0];
      if (tx.statusPembayaran === "KLAIM_PAKET") isBeli = false;
      else if (tx.program && tx.nominalProgram < tx.program.harga) isBeli = false;
    } else {
      isBeli = false;
    }
    return {
      nama: d.santri.nama,
      txCount: txs.length,
      txStatus: tx?.statusPembayaran,
      txNominal: tx?.nominalProgram,
      progHarga: tx?.program?.harga,
      isBeli
    }
  });

  return NextResponse.json(debug.slice(0, 50));
}
