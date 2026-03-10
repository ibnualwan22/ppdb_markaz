import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi DELETE: Menghapus Kamar spesifik
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Mengekstrak param dengan await sesuai standar Next.js App Router
    const { id } = await params;

    const kamarDihapus = await prisma.kamar.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "Kamar dan seluruh lemarinya berhasil dihapus", 
      kamarDihapus 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus Kamar" }, { status: 500 });
  }
}