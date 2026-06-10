import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dataSantri = await prisma.santri.findMany({
      where: {
        isAktif: true,
        riwayat: {
          some: {
            dufah: { isActive: true }
          }
        }
      },
      include: {
        riwayat: {
          where: { dufah: { isActive: true } },
          include: { dufah: true }
        },
        transaksi: {
          include: { program: true },
          orderBy: { createdAt: 'desc' as const },
          take: 1
        }
      },
      orderBy: { nama: 'asc' }
    });

    const result = dataSantri.map(santri => {
      const activeRiwayat = santri.riwayat[0];
      const programPilihan = santri.transaksi[0]?.program?.nama || "Belum Memilih Program";
      
      return {
        santriId: santri.id,
        nama: santri.nama,
        nis: santri.nis,
        program: programPilihan,
        riwayatId: activeRiwayat?.id,
        nilaiTauzi: (activeRiwayat as any)?.nilaiTauzi || null,
        kelasRekomendasi: (activeRiwayat as any)?.kelasRekomendasi || programPilihan,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tauzi fushul data:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
