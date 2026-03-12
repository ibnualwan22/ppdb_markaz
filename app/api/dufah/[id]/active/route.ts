import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dufahIdBaru = parseInt(id);

    // 1. Cari Duf'ah Lama (Untuk patokan copy data KSU)
    const dufahLama = await prisma.dufah.findFirst({ where: { isActive: true } });

    // 2. Matikan semua Duf'ah
    await prisma.dufah.updateMany({ data: { isActive: false } });

    // 3. Aktifkan Duf'ah yang baru dipilih
    const dufahAktif = await prisma.dufah.update({
      where: { id: dufahIdBaru },
      data: { isActive: true }
    });

    // ==========================================
    // LOGIKA BARU: AUTO-CO MASSAL (KECUALI KSU)
    // ==========================================
    await prisma.santri.updateMany({
      where: { 
        kategori: { not: "KSU" } // Semua santri BARU & LAMA akan dieksekusi
      },
      data: { 
        isAktif: false,   // Sapu bersih! (Otomatis Check Out sementara)
        kategori: "LAMA"  // Semua yang tadinya BARU otomatis naik kelas
      }
    });

    // 4. AUTO-MIGRASI KSU (Mereka kebal Auto-CO dan kamarnya diperpanjang otomatis)
    if (dufahLama) {
      const riwayatKsuLama = await prisma.riwayatDufah.findMany({
        where: {
          dufahId: dufahLama.id,
          santri: { kategori: "KSU", isAktif: true },
          lemariId: { not: null }
        }
      });

      for (const ksu of riwayatKsuLama) {
        const cekDuplikat = await prisma.riwayatDufah.findUnique({
          where: { santriId_dufahId: { santriId: ksu.santriId, dufahId: dufahAktif.id } }
        });

        if (!cekDuplikat) {
          await prisma.riwayatDufah.create({
            data: {
              santriId: ksu.santriId,
              dufahId: dufahAktif.id,
              lemariId: ksu.lemariId,
              status: "ASSIGNED",
              isIdCardTaken: true, 
              bulanKe: ksu.bulanKe + 1
            }
          });
        }
      }
    }

    return NextResponse.json({ 
      message: `${dufahAktif.nama} aktif. Santri reguler di-Auto-CO, KSU dimigrasi aman.`,
      data: dufahAktif 
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}