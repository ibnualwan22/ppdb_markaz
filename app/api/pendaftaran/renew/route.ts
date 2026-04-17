import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `RENEW-${dufahId}-${dateString}-${randomStr}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { santriId, programId } = body;

    if (!santriId || !programId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json({ error: "Duf'ah pendaftaran sedang ditutup" }, { status: 400 });
    }

    const kodeUnik = Math.floor(Math.random() * 900) + 100;
    const totalTagihan = program.harga + kodeUnik;

    const transaksi = await prisma.transaksiPendaftaran.create({
      data: {
        noKwitansi: generateInvoiceNumber(dufahAktif.id),
        santriId,
        programId,
        nominalProgram: program.harga,
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
