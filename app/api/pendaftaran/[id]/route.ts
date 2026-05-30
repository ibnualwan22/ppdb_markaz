import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Pastikan transaksi ada
    const transaksi = await prisma.transaksiPendaftaran.findUnique({
      where: { id }
    });

    if (!transaksi) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Hapus transaksi
    await prisma.transaksiPendaftaran.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Transaksi pendaftaran berhasil dihapus" });

  } catch (error: any) {
    console.error("Error menghapus transaksi:", error);
    return NextResponse.json({ error: "Gagal menghapus data transaksi pendaftaran" }, { status: 500 });
  }
}
