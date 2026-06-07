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

    // Gunakan transaction agar atomic
    await prisma.$transaction(async (tx) => {
      // Hapus transaksi
      await tx.transaksiPendaftaran.delete({
        where: { id }
      });

      // Jika transaksi PENDING, bersihkan juga RiwayatDufah yang belum lunas
      // agar tidak ada record "yatim" yang membuat santri tetap terdaftar di duf'ah
      if (transaksi.statusPembayaran === "PENDING" && transaksi.dufahTujuanId) {
        // Cek apakah santri masih punya transaksi LAIN (PENDING/PAID) untuk duf'ah yang sama
        const transaksiLain = await tx.transaksiPendaftaran.findFirst({
          where: {
            santriId: transaksi.santriId,
            dufahTujuanId: transaksi.dufahTujuanId,
            id: { not: transaksi.id }
          }
        });

        // Hanya hapus riwayat jika TIDAK ada transaksi lain & riwayat belum lunas
        if (!transaksiLain) {
          await tx.riwayatDufah.deleteMany({
            where: {
              santriId: transaksi.santriId,
              dufahId: transaksi.dufahTujuanId,
              isLunas: false  // HANYA hapus yang belum lunas, jangan sentuh yang sudah lunas
            }
          });
        }
      }
    });

    return NextResponse.json({ message: "Transaksi pendaftaran berhasil dihapus" });

  } catch (error: any) {
    console.error("Error menghapus transaksi:", error);
    return NextResponse.json({ error: "Gagal menghapus data transaksi pendaftaran" }, { status: 500 });
  }
}
