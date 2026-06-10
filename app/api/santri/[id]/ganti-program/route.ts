import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logActivity } from "@/app/lib/pusherServer";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { programId } = body;

    if (!programId) {
      return NextResponse.json(
        { error: "Program ID wajib diisi" },
        { status: 400 }
      );
    }

    // Cek program tujuan
    const program = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) {
      return NextResponse.json(
        { error: "Program tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek santri
    const santri = await prisma.santri.findUnique({
      where: { id },
      include: {
        program: true,
        transaksi: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { program: true },
        },
      },
    });
    if (!santri) {
      return NextResponse.json(
        { error: "Santri tidak ditemukan" },
        { status: 404 }
      );
    }

    const programLama = santri.program?.nama || santri.transaksi[0]?.program?.nama || "-";

    // Update programId di tabel santri (Override)
    await prisma.santri.update({
      where: { id },
      data: { programId },
    });

    await logActivity({
      aksi: "UPDATE",
      modul: "Master Santri",
      deskripsi: `Program santri ${santri.nama} diubah dari "${programLama}" ke "${program.nama}"`,
      namaUser: "Super Admin",
      targetId: santri.id,
    });

    return NextResponse.json({
      message: `Program berhasil diubah ke ${program.nama}`,
      data: { santriId: id, programId, programNama: program.nama },
    });
  } catch (error: any) {
    console.error("Error ganti program:", error);
    return NextResponse.json(
      { error: "Gagal mengubah program santri" },
      { status: 500 }
    );
  }
}
