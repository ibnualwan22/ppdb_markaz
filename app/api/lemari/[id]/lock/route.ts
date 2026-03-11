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
    const { isLocked } = body; 

    const lemariUpdate = await prisma.lemari.update({
      where: { id },
      data: { isLocked }
    });

    const status = isLocked ? "DIKUNCI 🔒" : "DIBUKA ✅";
    return NextResponse.json({ message: `Lemari ${lemariUpdate.nomor} berhasil ${status}` });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengubah status lemari" }, { status: 500 });
  }
}