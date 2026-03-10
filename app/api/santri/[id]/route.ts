import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH: Mengubah status isAktif (Cek Out / Berhenti)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isAktif } = body; // Akan menerima true atau false dari frontend

    const updateSantri = await prisma.santri.update({
      where: { id: id },
      data: { isAktif: isAktif }
    });

    const pesan = isAktif ? "Santri diaktifkan kembali" : "Santri berhasil di-Cek Out (Non-aktif)";
    
    return NextResponse.json({ message: pesan, data: updateSantri });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengubah status santri" }, { status: 500 });
  }
}