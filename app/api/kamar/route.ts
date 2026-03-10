import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi POST: Menambah Kamar ke dalam sebuah Sakan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, sakanId } = body;

    const kamarBaru = await prisma.kamar.create({
      data: {
        nama,
        sakanId // Penting: Harus ada ID Sakan tempat kamar ini berada
      }
    });

    return NextResponse.json(kamarBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Kamar baru" }, { status: 500 });
  }
}