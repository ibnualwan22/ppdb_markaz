import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi POST: Menambah Lemari (contoh: A1, A2) ke dalam Kamar
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomor, kamarId } = body;

    const lemariBaru = await prisma.lemari.create({
      data: {
        nomor,
        kamarId // Penting: Harus tahu lemari ini masuk kamar mana
      }
    });

    return NextResponse.json(lemariBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal membuat Lemari baru" }, { status: 500 });
  }
}