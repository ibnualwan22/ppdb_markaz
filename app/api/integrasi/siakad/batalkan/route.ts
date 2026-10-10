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

    const deleted = await prisma.transaksiPendaftaran.deleteMany({
      where: { santriId: santri.id, statusPembayaran: "PENDING" },
    });

    await logActivity({
      aksi: "DELETE",
      modul: "Integrasi API",
      deskripsi: `Santri membatalkan ${deleted.count} tagihan PENDING daftar ulang via SIAKAD a.n ${santri.nama} (NIS: ${santri.nis})`,
      namaUser: `Sistem SIAKAD`,
      targetId: santri.id,
    });

    return NextResponse.json({
      message: `${deleted.count} tagihan dibatalkan.`,
      data: { cancelledCount: deleted.count },
    });
  } catch (error: any) {
    console.error("Error batalkan SIAKAD:", error);
    return NextResponse.json({ error: "Gagal membatalkan tagihan", details: error.message }, { status: 500 });
  }
}
