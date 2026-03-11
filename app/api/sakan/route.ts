import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Cari Duf'ah yang sedang aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

    const dataSakan = await prisma.sakan.findMany({
      include: {
        kamar: {
          include: {
            lemari: {
              include: {
                // HANYA tarik penghuni di bulan ini, lengkapi dengan data santrinya
                penghuni: dufahAktif ? {
                  where: { dufahId: dufahAktif.id },
                  include: { santri: true }
                } : false
              },
              orderBy: { nomor: 'asc' }
            }
          },
          orderBy: { nama: 'asc' }
        }
      },
      orderBy: { nama: 'asc' }
    });
    return NextResponse.json(dataSakan);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat Sakan" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, kategori } = body; 

    const sakanBaru = await prisma.sakan.create({
      data: { 
        nama, 
        kategori: kategori || "BANIN" 
      }
    });

    return NextResponse.json(sakanBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Sakan" }, { status: 500 });
  }
}