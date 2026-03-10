import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("nama");

    // 1. Pastikan kita hanya mencari di Duf'ah yang sedang berjalan
    const dufahAktif = await prisma.dufah.findFirst({
      where: { isActive: true },
    });

    if (!dufahAktif) {
      return NextResponse.json(
        { error: "Tidak ada Duf'ah yang sedang aktif saat ini." },
        { status: 400 }
      );
    }

    // 2. Susun filter pencarian
    // Jika ada keyword ketikan, cari namanya. Jika kosong, tampilkan semua (bisa dibatasi nanti)
    const filterPencarian: any = {
      dufahId: dufahAktif.id,
      // Abaikan KSU karena mereka tidak lewat meja ID Card
      santri: {
        kategori: { not: "KSU" }
      }
    };

    if (keyword) {
      filterPencarian.santri.nama = {
        contains: keyword,
        mode: "insensitive",
      };
    }

    // 3. Tarik data riwayat beserta relasi nama santri dan penempatan lemarinya
    const daftarAntrian = await prisma.riwayatDufah.findMany({
      where: filterPencarian,
      include: {
        santri: {
          select: { nama: true, kategori: true }
        },
        lemari: {
          include: { kamar: true } // Membawa info kamar untuk ditampilkan di layar panitia
        }
      },
      orderBy: {
        santri: { nama: 'asc' }
      },
      take: 20 // Batasi 20 nama agar pencarian super ringan
    });

    return NextResponse.json(daftarAntrian);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data antrian ID Card" }, { status: 500 });
  }
}