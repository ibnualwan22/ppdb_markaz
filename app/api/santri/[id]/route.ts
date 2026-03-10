import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ingat untuk selalu menambahkan await pada params di struktur Next.js App Router
    const { id } = await params; 
    const body = await request.json();
    const { isIdCardTaken, status } = body;

    // Update status ID card pada tabel riwayat
    const updateRecord = await prisma.riwayatDufah.updateMany({
      where: {
        santriId: id,
        dufah: { isActive: true } // Update khusus untuk duf'ah yang sedang aktif
      },
      data: {
        isIdCardTaken,
        status: status || "CHECKED_IN"
      }
    });

    return NextResponse.json({ message: "Status ID Card berhasil diupdate", updateRecord });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}