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
    const { isLocked } = body; // Menerima true/false dari tombol Muasis

    const kamarUpdate = await prisma.kamar.update({
      where: { id },
      data: { isLocked }
    });

    const status = isLocked ? "DIKUNCI 🔒" : "DIBUKA ✅";
    return NextResponse.json({ message: `Kamar ${kamarUpdate.nama} berhasil ${status}` });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengubah status kamar" }, { status: 500 });
  }
}