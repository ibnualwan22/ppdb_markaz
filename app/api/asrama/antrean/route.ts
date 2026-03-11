import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Cari Duf'ah yang sedang berjalan
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    
    if (!dufahAktif) {
      return NextResponse.json([]);
    }

    // Tarik semua data riwayat yang statusnya PRE_LIST (butuh kamar) di bulan ini
    const antrean = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: dufahAktif.id,
        lemariId: null,
      },
      include: {
        santri: {
          select: { id: true, nama: true, kategori: true }
        }
      },
      orderBy: {
        santri: { nama: 'asc' }
      }
    });

    return NextResponse.json(antrean);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data antrean" }, { status: 500 });
  }
}