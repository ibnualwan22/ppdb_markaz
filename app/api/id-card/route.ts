import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("nama");

    const dufahAktif = await prisma.dufah.findFirst({
      where: { isActive: true },
    });

    if (!dufahAktif) {
      return NextResponse.json(
        { error: "Tidak ada Duf'ah yang sedang aktif saat ini." },
        { status: 400 }
      );
    }

    const filterPencarian: any = {
      dufahId: dufahAktif.id,
      santri: { kategori: { not: "KSU" } } // KSU tidak lewat meja ID Card
    };

    if (keyword) {
      filterPencarian.santri.nama = {
        contains: keyword,
        mode: "insensitive",
      };
    }

    const daftarAntrian = await prisma.riwayatDufah.findMany({
      where: filterPencarian,
      include: {
        santri: {
          select: { nama: true, kategori: true }
        },
        lemari: {
          include: { 
            kamar: { 
              include: { sakan: true } // Menambahkan relasi Sakan di sini
            } 
          }
        }
      },
      orderBy: { santri: { nama: 'asc' } }
      // take: 20 -> Dihapus agar semua nama tampil sekaligus
    });

    return NextResponse.json(daftarAntrian);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data antrian ID Card" }, { status: 500 });
  }
}