import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, foto, trackRecord, urutan, isActive } = body;

    const updated = await prisma.pengajar.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(foto !== undefined && { foto: foto || null }),
        ...(trackRecord !== undefined && { trackRecord }),
        ...(urutan !== undefined && { urutan: parseInt(urutan) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error PATCH Pengajar:", error);
    return NextResponse.json({ error: "Gagal memperbarui pengajar" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.pengajar.delete({ where: { id } });
    return NextResponse.json({ message: "Pengajar berhasil dihapus" });
  } catch (error) {
    console.error("Error DELETE Pengajar:", error);
    return NextResponse.json({ error: "Gagal menghapus pengajar" }, { status: 500 });
  }
}
