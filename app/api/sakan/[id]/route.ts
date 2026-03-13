import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate } from "@/app/lib/pusherServer";
const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json(); 
  // Pakai 'body' langsung agar bisa menerima update apa saja (nama, kategori, atau isLocked)
  const update = await prisma.sakan.update({ where: { id }, data: body });
  emitDataUpdate("sakan");
  return NextResponse.json(update);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.sakan.delete({ where: { id } });
  emitDataUpdate("sakan");
  return NextResponse.json({ message: "Sakan dihapus" });
}