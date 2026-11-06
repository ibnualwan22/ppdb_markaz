import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/dufah — daftar dufah (dipakai landing publik, formulir
// pendaftaran/daftar-ulang, dan halaman admin). Tetap terbuka (GET).
//
// POST /api/dufah (buat dufah manual) DIHAPUS — rancangan PPDB-pendaftaran
// (6 Nov 2026): nama dufah dibuat di Bawwabah; baris PPDB dibuat otomatis
// lewat POST /api/bawwabah/dufah saat draf dibuat di Bawwabah.

export async function GET() {
  try {
    const daftarDufah = await prisma.dufah.findMany({
      orderBy: { id: 'desc' } // Urutkan dari yang terbaru
    });
    return NextResponse.json(daftarDufah);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}