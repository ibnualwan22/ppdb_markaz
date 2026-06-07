import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";


export async function GET() {
  try {
    const daftarDufah = await prisma.dufah.findMany({
      orderBy: { id: 'desc' } // Urutkan dari yang terbaru
    });
    return NextResponse.json(daftarDufah);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, tanggalBuka, tanggalTutup } = body;

    const dufahBaru = await prisma.dufah.create({
      data: {
        nama,
        isActive: false, // Default selalu false sampai diaktifkan manual
        tanggalBuka: tanggalBuka ? new Date(`${tanggalBuka}+07:00`) : null,
        tanggalTutup: tanggalTutup ? new Date(`${tanggalTutup}+07:00`) : null,
      }
    });

    notifySiakadWebhook();

    return NextResponse.json(dufahBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Duf'ah baru" }, { status: 500 });
  }
}