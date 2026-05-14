import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID wajib diisi" }, { status: 400 });
    }

    const riwayat = await prisma.riwayatDufah.findUnique({
      where: { id },
      include: { santri: true, dufah: true }
    });

    if (!riwayat || riwayat.isLunas) {
      return NextResponse.json({ error: "Data riwayat tidak ditemukan atau sudah diverifikasi lunas" }, { status: 400 });
    }

    // Jalankan verifikasi
    const updatedRiwayat = await prisma.$transaction(async (tx) => {
      const updated = await tx.riwayatDufah.update({
        where: { id },
        data: { isLunas: true }
      });

      // Pastikan batasAktifDufah santri mencakup dufah ini
      const santriDb = await tx.santri.findUnique({ where: { id: riwayat.santriId } });
      const currentBatas = santriDb?.batasAktifDufah || 0;
      if (currentBatas < riwayat.dufahId) {
        await tx.santri.update({
          where: { id: riwayat.santriId },
          data: { batasAktifDufah: riwayat.dufahId, isAktif: true }
        });
      }

      return updated;
    });

    emitDataUpdate("pendaftaran-verified");
    emitDataUpdate("mimstore");
    emitDataUpdate("id-card");

    // Kirim notifikasi ke admin asrama dan id-card
    await sendGlobalNotification(
      "Daftar Ulang Terverifikasi 🔄",
      `Daftar ulang santri lama a.n ${riwayat.santri.nama} telah diverifikasi lunas oleh Keuangan.`,
      "receive_notif_plot_asrama",
      "/admin/asrama"
    );

    // Ambil nama admin
    const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { nama: true, username: true } });
    const pelaku = adminUser ? `${adminUser.nama} (@${adminUser.username})` : "Admin Keuangan";

    await logActivity({
      aksi: "VERIFY",
      modul: "Keuangan",
      deskripsi: `Memverifikasi lunas daftar ulang santri lama a.n ${riwayat.santri.nama} untuk Duf'ah: ${riwayat.dufah.nama}`,
      namaUser: pelaku,
      userId: adminId,
      targetId: riwayat.santriId,
    });

    return NextResponse.json({
      message: "Daftar ulang santri lama berhasil diverifikasi lunas.",
      data: updatedRiwayat
    });
  } catch (error: any) {
    console.error("Error Verifikasi Daftar Ulang:", error);
    return NextResponse.json({ error: "Gagal memverifikasi daftar ulang", details: error.message }, { status: 500 });
  }
}
