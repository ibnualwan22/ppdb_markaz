import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Mengambil daftar semua santri beserta riwayat lengkapnya
export async function GET() {
  try {
    const dataSantri = await prisma.santri.findMany({
      include: {
        riwayat: {
          include: {
            dufah: true,
            lemari: {
              include: {
                kamar: {
                  include: { sakan: true }
                }
              }
            }
          },
          orderBy: { dufahId: 'desc' } // Urutkan dari riwayat terbaru
        }
      },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json(dataSantri);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data master santri" }, { status: 500 });
  }
}

// POST: Jika sewaktu-waktu butuh input santri murni TANPA penempatan kamar
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, kategori } = body;

    if (!nama || !kategori) {
      return NextResponse.json({ error: "Nama dan kategori wajib diisi" }, { status: 400 });
    }

    const santriBaru = await prisma.santri.create({
      data: {
        nama,
        kategori,
        isAktif: true
      }
    });

    return NextResponse.json(santriBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat data santri" }, { status: 500 });
  }
}