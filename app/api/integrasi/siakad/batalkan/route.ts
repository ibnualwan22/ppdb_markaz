import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/app/lib/pusherServer";

// POST /api/integrasi/siakad/batalkan
// Body: { nis }
// Membatalkan (menghapus) SEMUA tagihan PENDING milik santri. Transaksi PAID tidak tersentuh.
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SIAKAD_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 403 });
    }

    const body = await req.json();
    const { nis } = body;
    if (!nis) {
      return NextResponse.json({ error: "Data 'nis' wajib dikirim." }, { status: 400 });
    }

    const santri = await prisma.santri.findUnique({ where: { nis } });
    if (!santri) {
      return NextResponse.json({ error: `Santri dengan NIS ${nis} tidak ditemukan.` }, { status: 404 });
    }

    const pendingList = await prisma.transaksiPendaftaran.findMany({
      where: { santriId: santri.id, statusPembayaran: "PENDING" },
      select: { dufahTujuanId: true },
    });
    const dufahIds = [...new Set(pendingList.map((t) => t.dufahTujuanId).filter((id): id is number => id !== null))];

    const deleted = await prisma.transaksiPendaftaran.deleteMany({
      where: { santriId: santri.id, statusPembayaran: "PENDING" },
    });

    // Hapus juga riwayat booking (belum lunas) untuk dufah tujuan yang
    // dibatalkan, agar santri tidak tertinggal di data sakan/antrean
    // setelah batal daftar ulang. Riwayat yang sudah lunas (ACC) tidak tersentuh.
    let riwayatDihapus = 0;
    if (dufahIds.length > 0) {
      const hapusRiwayat = await prisma.riwayatDufah.deleteMany({
        where: { santriId: santri.id, dufahId: { in: dufahIds }, isLunas: false },
      });
      riwayatDihapus = hapusRiwayat.count;
    }

    await logActivity({
      aksi: "DELETE",
      modul: "Integrasi API",
      deskripsi: `Santri membatalkan ${deleted.count} tagihan PENDING daftar ulang via SIAKAD a.n ${santri.nama} (NIS: ${santri.nis}) — riwayat booking dihapus: ${riwayatDihapus}`,
      namaUser: `Sistem SIAKAD`,
      targetId: santri.id,
    });

    return NextResponse.json({
      message: `${deleted.count} tagihan dibatalkan.`,
      data: { cancelledCount: deleted.count, riwayatBookingDihapus: riwayatDihapus },
    });
  } catch (error: any) {
    console.error("Error batalkan SIAKAD:", error);
    return NextResponse.json({ error: "Gagal membatalkan tagihan", details: error.message }, { status: 500 });
  }
}
