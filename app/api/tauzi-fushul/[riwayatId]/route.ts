import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: Promise<{ riwayatId: string }> }) {
  try {
    const { riwayatId } = await params;
    const body = await request.json();
    const { nilaiTauzi, kelasRekomendasi } = body;

    const updated = await (prisma.riwayatDufah as any).update({
      where: { id: riwayatId },
      data: {
        nilaiTauzi: nilaiTauzi === "" || nilaiTauzi === null ? null : parseInt(nilaiTauzi),
        kelasRekomendasi: kelasRekomendasi || null
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating tauzi fushul data:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}
