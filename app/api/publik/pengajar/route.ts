import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Public endpoint - hanya menampilkan pengajar aktif
export async function GET() {
  try {
    const pengajar = await prisma.pengajar.findMany({
      where: { isActive: true },
      orderBy: { urutan: "asc" },
      select: {
        id: true,
        nama: true,
        foto: true,
        trackRecord: true,
      },
    });
    return NextResponse.json(pengajar);
  } catch (error) {
    console.error("Error GET Public Pengajar:", error);
    return NextResponse.json([], { status: 200 });
  }
}
