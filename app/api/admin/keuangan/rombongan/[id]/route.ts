import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: rombonganId } = await params;

    const rombongan = await prisma.rombongan.findUnique({
      where: { id: rombonganId },
      include: {
        transaksi: {
          include: { santri: true }
        }
      }
    });

    if (!rombongan) {
      return NextResponse.json({ error: "Rombongan tidak ditemukan" }, { status: 404 });
    }

    if (rombongan.statusPembayaran === "PAID") {
      return NextResponse.json({ error: "Rombongan sudah lunas, tidak dapat dihapus" }, { status: 400 });
    }

    for (const t of rombongan.transaksi) {
      await prisma.transaksiPendaftaran.delete({ where: { id: t.id } });
      await prisma.santri.delete({ where: { id: t.santriId } });
    }

    await prisma.rombongan.delete({ where: { id: rombonganId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
