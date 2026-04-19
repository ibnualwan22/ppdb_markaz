import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error GET Program:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data program" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, harga, durasiBulan, isActive, tanggalMulaiDefault, tanggalTutupDefault } = body;

    if (!nama || harga === undefined || durasiBulan === undefined) {
      return NextResponse.json(
        { error: "Nama, harga, dan durasi bulan wajib diisi" },
        { status: 400 }
      );
    }

    const newProgram = await prisma.program.create({
      data: {
        nama,
        harga: parseFloat(harga),
        durasiBulan: parseInt(durasiBulan),
        isActive: isActive !== undefined ? isActive : true,
        tanggalMulaiDefault,
        tanggalTutupDefault
      },
    });

    return NextResponse.json(newProgram, { status: 201 });
  } catch (error) {
    console.error("Error POST Program:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan program" },
      { status: 500 }
    );
  }
}
