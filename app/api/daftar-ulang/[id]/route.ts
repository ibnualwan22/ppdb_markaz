import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, logActivity } from "@/app/lib/pusherServer";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const riwayat = await prisma.riwayatDufah.findUnique({
      where: { id },
      include: { santri: true, dufah: true }
    });

    if (!riwayat) {
      return NextResponse.json({ error: "Data riwayat tidak ditemukan" }, { status: 404 });
    }

    if (riwayat.isLunas) {
      return NextResponse.json({ error: "Tidak dapat membatalkan daftar ulang yang sudah terverifikasi lunas" }, { status: 400 });
    }

    // Hapus riwayat dan set isAktif santri menjadi false jika ini satu-satunya riwayat aktifnya
    await prisma.$transaction(async (tx) => {
      await tx.riwayatDufah.delete({
        where: { id }
      });

      // Cek apakah santri punya riwayat lain di dufah aktif
      const dufahAktif = await tx.dufah.findFirst({ where: { isActive: true } });
      if (dufahAktif) {
        const otherRiwayat = await tx.riwayatDufah.findFirst({
          where: { santriId: riwayat.santriId, dufahId: dufahAktif.id }
        });
        if (!otherRiwayat) {
          await tx.santri.update({
            where: { id: riwayat.santriId },
            data: { isAktif: false }
          });
        }
      }
    });

    emitDataUpdate("pendaftaran-verified");
    emitDataUpdate("asrama");

    await logActivity({
      aksi: "DELETE",
      modul: "Keuangan",
      deskripsi: `Membatalkan daftar ulang santri lama a.n ${riwayat.santri.nama} untuk Duf'ah: ${riwayat.dufah.nama}`,
      namaUser: "Admin Keuangan",
      targetId: riwayat.santriId,
    });

    return NextResponse.json({ message: "Daftar ulang berhasil dibatalkan." });
  } catch (error: any) {
    console.error("Error Batalkan Daftar Ulang:", error);
    return NextResponse.json({ error: "Gagal membatalkan daftar ulang", details: error.message }, { status: 500 });
  }
}
