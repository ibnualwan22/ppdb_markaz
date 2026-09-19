import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.kategoriProgram.findMany({
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, isActive } = body;

    const data = await prisma.kategoriProgram.create({
      data: { nama: nama.toUpperCase(), isActive }
    });
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama Kategori sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
