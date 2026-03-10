import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Format Next.js terbaru
) {
  try {
    const { id } = await params;
    const dufahId = parseInt(id);

    // 1. Matikan semua Duf'ah yang ada
    await prisma.dufah.updateMany({
      data: { isActive: false }
    });

    // 2. Aktifkan HANYA Duf'ah yang dipilih
    const dufahAktif = await prisma.dufah.update({
      where: { id: dufahId },
      data: { isActive: true }
    });

    return NextResponse.json({ 
      message: `${dufahAktif.nama} berhasil diaktifkan sebagai periode saat ini!`,
      data: dufahAktif 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}