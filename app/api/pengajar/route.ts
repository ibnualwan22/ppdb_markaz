import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pengajar = await prisma.pengajar.findMany({
      orderBy: { urutan: "asc" },
    });
    return NextResponse.json(pengajar);
  } catch (error) {
    console.error("Error GET Pengajar:", error);
    return NextResponse.json({ error: "Gagal mengambil data pengajar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, foto, trackRecord, urutan, isActive } = body;

    if (!nama) {
      return NextResponse.json({ error: "Nama pengajar wajib diisi" }, { status: 400 });
    }

    const newPengajar = await prisma.pengajar.create({
      data: {
        nama,
        foto: foto || null,
        trackRecord: trackRecord || [],
        urutan: urutan !== undefined ? parseInt(urutan) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(newPengajar, { status: 201 });
  } catch (error) {
    console.error("Error POST Pengajar:", error);
    return NextResponse.json({ error: "Gagal menambahkan pengajar" }, { status: 500 });
  }
}
