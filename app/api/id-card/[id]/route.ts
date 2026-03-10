import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Format wajib Next.js terbaru
) {
  try {
    // Ingat untuk selalu menambahkan await pada params
    const { id } = await params; 

    // Update baris riwayat duf'ah spesifik ini
    const updateCheckIn = await prisma.riwayatDufah.update({
      where: { 
        id: id // Ini adalah ID dari tabel RiwayatDufah, BUKAN ID Santri
      },
      data: {
        isIdCardTaken: true,
        status: "CHECKED_IN"
      },
      // Kembalikan juga nama santrinya untuk pop-up sukses di frontend
      include: {
        santri: { select: { nama: true } }
      }
    });

    return NextResponse.json({ 
      message: `ID Card berhasil diserahkan kepada ${updateCheckIn.santri.nama}`,
      data: updateCheckIn 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses penyerahan ID Card" }, { status: 500 });
  }
}