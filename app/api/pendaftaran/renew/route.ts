import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/app/lib/rateLimit";

const prisma = new PrismaClient();

function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `RENEW-${dufahId}-${dateString}-${randomStr}`;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi setelah 5 menit." }, { status: 429 });
    }

    const body = await request.json();
    const { santriId, programId, isBeliAtribut } = body;

    if (!santriId || !programId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'asc' } });
    const now = new Date();
    
    // Cari Dufah yang rentang pendaftarannya mencakup waktu saat ini
    const targetDufah = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    if (!targetDufah) {
      return NextResponse.json({ error: "Pendaftaran saat ini sedang ditutup. Tidak ada periode Duf'ah yang buka." }, { status: 400 });
    }

    const dufahTujuanId = targetDufah.id;

    const kodeUnik = Math.floor(Math.random() * 900) + 100;
    
    // Potong 100rb jika tidak beli atribut
    const nominalProgram = isBeliAtribut ? program.harga : Math.max(0, program.harga - 100000);
    const totalTagihan = nominalProgram + kodeUnik;

    const transaksi = await prisma.transaksiPendaftaran.create({
      data: {
        noKwitansi: generateInvoiceNumber(dufahTujuanId),
        santriId,
        programId,
        dufahTujuanId,
        nominalProgram,
        kodeUnik,
        totalTagihan,
        statusPembayaran: "PENDING"
      }
    });

    return NextResponse.json({
      message: "Tagihan perpanjangan berhasil diterbitkan.",
      data: { transaksi, program }
    });
  } catch (error: any) {
    console.error("Error renew:", error);
    return NextResponse.json({ error: "Gagal menerbitkan tagihan" }, { status: 500 });
  }
}
