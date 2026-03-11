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
    const { isAktif } = body;

    // 1. Update profil utamanya
    const santriUpdate = await prisma.santri.update({
      where: { id },
      data: { isAktif }
    });

    // 2. LOGIKA PENGUSIRAN KAMAR
    // Jika dia di-set Boyong (isAktif = false), kita harus kosongkan kamarnya di Duf'ah yang sedang berjalan
    if (isAktif === false) {
      const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
      
      if (dufahAktif) {
        await prisma.riwayatDufah.updateMany({
          where: {
            santriId: id,
            dufahId: dufahAktif.id
          },
          data: {
            lemariId: null,      // Cabut kunci lemarinya!
            status: "PRE_LIST"   // Kembalikan statusnya jadi antrean (meski dia boyong)
          }
        });
      }
    }

    return NextResponse.json({ message: "Status berhasil diubah", data: santriUpdate });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}