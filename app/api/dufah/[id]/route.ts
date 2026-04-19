import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, tanggalBuka, tanggalTutup } = body;

    const dufahUpdate = await prisma.dufah.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        // Konversi string dari frontend menjadi format Date yang dipahami database
        tanggalBuka: tanggalBuka ? new Date(`${tanggalBuka}+07:00`) : null,
        tanggalTutup: tanggalTutup ? new Date(`${tanggalTutup}+07:00`) : null,
      }
    });

    return NextResponse.json({ message: "Duf'ah berhasil diperbarui", data: dufahUpdate });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui Duf'ah" }, { status: 500 });
  }
}