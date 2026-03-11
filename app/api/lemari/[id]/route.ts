import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const update = await prisma.lemari.update({ where: { id }, data: body });
  return NextResponse.json(update);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.lemari.delete({ where: { id } });
  return NextResponse.json({ message: "Lemari dihapus" });
}