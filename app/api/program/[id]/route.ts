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
    const { nama, harga, durasiBulan, isActive, tanggalMulaiDefault, tanggalTutupDefault } = body;

    const program = await prisma.program.update({
      where: { id },
      data: {
        nama,
        harga: harga !== undefined ? parseFloat(harga) : undefined,
        durasiBulan:
          durasiBulan !== undefined ? parseInt(durasiBulan) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        tanggalMulaiDefault,
        tanggalTutupDefault
      },
    });

    return NextResponse.json(
      { message: "Program berhasil diperbarui", data: program },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error PATCH Program:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui program" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.program.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Program berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error DELETE Program:", error);
    return NextResponse.json(
      { error: "Gagal menghapus program" },
      { status: 500 }
    );
  }
}
