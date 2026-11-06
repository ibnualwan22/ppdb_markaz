import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";

// PATCH /api/dufah/[id] — rancangan PPDB-pendaftaran (6 Nov 2026): halaman
// PPDB hanya mengatur JADWAL PENDAFTARAN (buka/tutup). Nama dufah dibuat di
// Bawwabah dan tidak bisa diubah dari PPDB — body yang membawa `nama`
// ditolak 400. Hanya field tanggal yang ada di body yang diubah (field yang
// tidak dikirim dibiarkan, tidak di-nol-kan).
//
// DELETE /api/dufah/[id] DIHAPUS (bersamaan dengan tombol Hapus di halaman
// admin): pusat kendali ada di Bawwabah.

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, tanggalBuka, tanggalTutup } = body;

    if (nama !== undefined) {
      return NextResponse.json(
        { error: "Nama duf'ah tidak bisa diubah dari PPDB — nama dibuat di Bawwabah" },
        { status: 400 }
      );
    }

    const data: { tanggalBuka?: Date | null; tanggalTutup?: Date | null } = {};
    if (tanggalBuka !== undefined) {
      // Konversi string dari frontend menjadi format Date yang dipahami database
      data.tanggalBuka = tanggalBuka ? new Date(`${tanggalBuka}+07:00`) : null;
    }
    if (tanggalTutup !== undefined) {
      data.tanggalTutup = tanggalTutup ? new Date(`${tanggalTutup}+07:00`) : null;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Tidak ada yang diubah — kirim tanggalBuka dan/atau tanggalTutup" },
        { status: 400 }
      );
    }

    const dufahUpdate = await prisma.dufah.update({
      where: { id: parseInt(id) },
      data,
    });

    await notifySiakadWebhook();

    return NextResponse.json({ message: "Jadwal pendaftaran berhasil diperbarui", data: dufahUpdate });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui jadwal pendaftaran" }, { status: 500 });
  }
}