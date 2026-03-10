import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dufahId = parseInt(id);

    // 1. Matikan semua Duf'ah
    await prisma.dufah.updateMany({ data: { isActive: false } });

    // 2. Aktifkan Duf'ah yang dipilih
    const dufahAktif = await prisma.dufah.update({
      where: { id: dufahId },
      data: { isActive: true }
    });

    // ==========================================
    // LOGIKA BARU: NAIK KELAS (BARU -> LAMA)
    // ==========================================
    // Ubah semua santri berstatus BARU menjadi LAMA (Kecuali KSU dan santri tidak aktif)
    await prisma.santri.updateMany({
      where: { 
        kategori: "BARU",
        isAktif: true
      },
      data: { 
        kategori: "LAMA" 
      }
    });

    return NextResponse.json({ 
      message: `${dufahAktif.nama} aktif. Semua Santri Baru otomatis menjadi Santri Lama.`,
      data: dufahAktif 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}