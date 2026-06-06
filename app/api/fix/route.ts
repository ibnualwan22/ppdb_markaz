export const dynamic = 'force-dynamic';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
  if (!dufahAktif) return NextResponse.json({ error: "No active dufah" });

  const allActiveSantri = await prisma.santri.findMany({
    where: { isAktif: true },
    include: { riwayat: { where: { dufahId: dufahAktif.id } } }
  });

  const ghosts = allActiveSantri.filter(s => {
    if (s.riwayat.length === 0) return true;
    if (s.riwayat[0].status === "CHECKED_OUT") return true;
    return false;
  });

  return NextResponse.json({ ghosts: ghosts.map(g => ({ id: g.id, nama: g.nama, riwayatLength: g.riwayat.length })) });
}
