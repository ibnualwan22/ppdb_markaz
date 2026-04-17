import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Cari Duf'ah yang sedang berjalan
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    
    if (!dufahAktif) {
      return NextResponse.json([]);
    }

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahAktif.id } },
      orderBy: { id: 'desc' }
    });

    // Tarik semua data riwayat yang statusnya PRE_LIST (butuh kamar) di bulan ini
    const antrean = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: dufahAktif.id,
        lemariId: null,
      },
      include: {
        santri: {
          select: { id: true, nama: true, kategori: true, gender: true, nis: true, kabupaten: true }
        }
      },
      orderBy: {
        santri: { nama: 'asc' }
      }
    });

    // Tempelkan keterangan histori kamar/sakan sebelumnya
    const antreanDenganHistori = await Promise.all(antrean.map(async (row) => {
      let keteranganSakanLama = "";
      if (dufahLama) {
        const historiLama = await prisma.riwayatDufah.findFirst({
          where: {
            santriId: row.santriId,
            dufahId: dufahLama.id,
            lemariId: { not: null }
          },
          include: {
            lemari: {
              include: {
                kamar: {
                  include: {
                    sakan: true
                  }
                }
              }
            }
          }
        });

        if (historiLama?.lemari) {
          keteranganSakanLama = `${historiLama.lemari.kamar.sakan.nama} (Kamar ${historiLama.lemari.kamar.nama})`;
        }
      }

      return {
        ...row,
        keteranganSakanLama
      };
    }));

    return NextResponse.json(antreanDenganHistori);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data antrean" }, { status: 500 });
  }
}