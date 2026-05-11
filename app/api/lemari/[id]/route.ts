import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate } from "@/app/lib/pusherServer";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const update = await prisma.lemari.update({ where: { id }, data: body });
  emitDataUpdate("lemari");
  return NextResponse.json(update);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.lemari.delete({ where: { id } });
  emitDataUpdate("lemari");
  return NextResponse.json({ message: "Lemari dihapus" });
}