import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "AKTIF"; // Default adalah AKTIF

    let filterPencarian: any = {};

    if (filter === "AKTIF") {
      // MODE 1: Hanya santri yang saat ini masih di Markaz
      filterPencarian = { isAktif: true };
    } else if (filter === "ALL") {
      // MODE 2: Global (Termasuk yang sudah Check Out)
      filterPencarian = {}; 
    } else {
      // MODE 3: Historis (Siapa saja yang mendaftar di Duf'ah X)
      const dufahId = parseInt(filter);
      if (!isNaN(dufahId)) {
        filterPencarian = {
          riwayat: {
            some: { dufahId: dufahId }
          }
        };
      }
    }

    const dataSantri = await prisma.santri.findMany({
      where: filterPencarian,
      include: {
        riwayat: {
          include: {
            dufah: true,
            lemari: { include: { kamar: { include: { sakan: true } } } }
          },
          orderBy: { dufahId: 'desc' }
        }
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json(dataSantri);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data master santri" }, { status: 500 });
  }
}