import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/integrasi/siakad/status-bayar?nis=XXXX
// Mengembalikan tagihan PENDING daftar ulang milik santri (untuk layar "Menunggu Verifikasi" di Siakad).
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SIAKAD_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 403 });
    }

    const nis = req.nextUrl.searchParams.get("nis");
    if (!nis) {
      return NextResponse.json({ error: "Parameter 'nis' wajib dikirim." }, { status: 400 });
    }

    const santri = await prisma.santri.findUnique({ where: { nis } });
    if (!santri) {
      return NextResponse.json({ data: { pending: null } });
    }

    // Tentukan dufah target (logika sama seperti pendaftaran): yang sedang buka pendaftaran.
    // Hanya tagihan PENDING untuk periode ini yang relevan; tagihan basi periode lalu diabaikan.
    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'desc' } });
    const now = new Date();
    let targetDufah = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });
    if (!targetDufah) {
      targetDufah = (await prisma.dufah.findFirst({ where: { isActive: true } })) || undefined;
      if (!targetDufah) targetDufah = allDufahs[0];
    }

    const pending = await prisma.transaksiPendaftaran.findFirst({
      where: {
        santriId: santri.id,
        statusPembayaran: "PENDING",
        dufahTujuanId: targetDufah?.id,
      },
      include: { program: true, dufahTujuan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!pending) {
      return NextResponse.json({ data: { pending: null } });
    }

    return NextResponse.json({
      data: {
        pending: {
          id: pending.id,
          noKwitansi: pending.noKwitansi,
          nominalProgram: pending.nominalProgram,
          kodeUnik: pending.kodeUnik,
          totalTagihan: pending.totalTagihan,
          createdAt: pending.createdAt,
          program: { id: pending.program.id, nama: pending.program.nama },
          dufah: pending.dufahTujuan ? { id: pending.dufahTujuan.id, nama: pending.dufahTujuan.nama } : null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error status-bayar SIAKAD:", error);
    return NextResponse.json({ error: "Gagal memeriksa status pembayaran", details: error.message }, { status: 500 });
  }
}
