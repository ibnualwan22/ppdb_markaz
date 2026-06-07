import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const nis = '89210406012';
  const dufahTujuan = 10;

  const santri = await prisma.santri.findUnique({
    where: { nis }
  });

  if (!santri) {
    return NextResponse.json({ success: false, message: "Santri tidak ditemukan." });
  }

  const result = await prisma.riwayatDufah.deleteMany({
    where: {
      santriId: santri.id,
      dufahId: dufahTujuan
    }
  });

  return NextResponse.json({ success: true, count: result.count, message: `Dihapus ${result.count} riwayat Dufah 10 untuk Ainur Syafiq Prabandaru.` });
}
