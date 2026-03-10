import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi GET: Mengambil semua Sakan beserta isi Kamar dan Lemarinya
export async function GET() {
  try {
    const dataSakan = await prisma.sakan.findMany({
      include: {
        kamar: {
          include: {
            lemari: true // Tarik juga data lemari di dalam kamar
          }
        }
      },
      orderBy: {
        nama: 'asc' // Urutkan sesuai abjad
      }
    });
    
    // Data yang keluar sudah berbentuk "Pohon" (Tree), sangat sempurna untuk UI Denah Muasis
    return NextResponse.json(dataSakan);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data Sakan" }, { status: 500 });
  }
}

// Fungsi POST: Untuk Admin menambah gedung/Sakan baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama } = body;

    const sakanBaru = await prisma.sakan.create({
      data: {
        nama
      }
    });

    return NextResponse.json(sakanBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Sakan baru" }, { status: 500 });
  }
}