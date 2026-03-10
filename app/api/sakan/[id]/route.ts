import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi DELETE: Menghapus Sakan
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Format params terbaru
) {
  try {
    // Ingat untuk mengekstrak param dengan await
    const { id } = await params;

    // Menghapus Sakan. Karena di schema kita pakai onDelete: Cascade,
    // Semua Kamar dan Lemari di dalam Sakan ini akan OTOMATIS terhapus bersih!
    const sakanDihapus = await prisma.sakan.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json({ 
      message: "Sakan beserta seluruh kamar dan lemari di dalamnya berhasil dihapus",
      sakanDihapus 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus Sakan" }, { status: 500 });
  }
}