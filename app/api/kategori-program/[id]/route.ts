import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { nama, isActive } = body;
    
    const updateData: any = {};
    if (nama !== undefined) updateData.nama = nama.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;

    const data = await prisma.kategoriProgram.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json(data);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nama Kategori sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    await prisma.kategoriProgram.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
