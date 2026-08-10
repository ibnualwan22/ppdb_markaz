import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. Cek Permission via Environment Variable
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SIAKAD_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 403 });
    }

    const body = await req.json();
    const nis = body?.nis;
    const bulanKe = parseInt(body?.bulanKe);

    if (!nis || isNaN(bulanKe)) {
      return NextResponse.json({ error: "Format payload tidak valid. Membutuhkan 'nis' dan 'bulanKe'." }, { status: 400 });
    }

    // 2. Cari santri beserta riwayat terbaru (tanpa filter status agar tidak gagal update)
    const santri = await prisma.santri.findUnique({
      where: { nis },
      include: {
        riwayat: {
          orderBy: {
            id: 'desc'
          },
          take: 1
        }
      }
    });

    if (!santri || santri.riwayat.length === 0) {
      return NextResponse.json({ error: "Santri atau Riwayat tidak ditemukan." }, { status: 404 });
    }

    // 3. Update RiwayatDufah
    const targetRiwayat = santri.riwayat[0];
    await prisma.riwayatDufah.update({
      where: { id: targetRiwayat.id },
      data: { bulanKe }
    });

    // Tidak memanggil notifySiakadWebhook() karena SIAKAD
    // sudah melakukan update lokal sendiri. Webhook sync_all
    // justru menyebabkan race condition yang menimpa nilai baru.

    return NextResponse.json({
      success: true,
      message: `Bulan Ke berhasil diperbarui menjadi bulan ke-${bulanKe}.`,
      data: { nis, bulanKe }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error Integrasi SIAKAD Update Bulan Ke:", error);
    return NextResponse.json({ error: "Gagal memperbarui Bulan Ke", details: error.message }, { status: 500 });
  }
}

