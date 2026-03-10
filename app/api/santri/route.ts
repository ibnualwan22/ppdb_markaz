import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi GET: Untuk mencari nama santri (dipakai santri lama saat isi link)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("nama");

  try {
    if (keyword) {
      // Jika ada pencarian nama, cari santri yang namanya mirip
      const santri = await prisma.santri.findMany({
        where: {
          nama: {
            contains: keyword,
            // mode: "insensitive" // Aktifkan jika pakai PostgreSQL agar tidak case-sensitive
          }
        },
        include: {
          riwayat: true // Bawa data riwayat duf'ah-nya juga
        }
      });
      return NextResponse.json(santri);
    }

    // Jika tidak ada parameter, tampilkan semua (bisa dibatasi dengan take/skip nanti)
    const semuaSantri = await prisma.santri.findMany();
    return NextResponse.json(semuaSantri);
    
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// Fungsi POST: Untuk menambahkan santri baru ke asrama
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, kategori, dufahId, kamar, lemari } = body;

    // Insert ke tabel Santri sekaligus membuat RiwayatDufah bulan ini
    const santriBaru = await prisma.santri.create({
      data: {
        nama,
        kategori,
        riwayat: {
          create: {
            dufahId,
            kamar,
            lemari,
            status: "ASSIGNED" // Karena langsung dapat kamar
          }
        }
      }
    });

    return NextResponse.json(santriBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}