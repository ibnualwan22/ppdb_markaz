import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalSantriDB = await prisma.santri.count({ where: { isAktif: true } });
    return NextResponse.json({ totalSantriDB });
  } catch (error) {
    console.error("Error GET Stats:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik" },
      { status: 500 }
    );
  }
}
