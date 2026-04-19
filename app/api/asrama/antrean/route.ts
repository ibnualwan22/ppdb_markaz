import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Cari Duf'ah yang sedang berjalan (isActive)
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    
    if (!dufahAktif) {
      return NextResponse.json([]);
    }

    // Cari juga Duf'ah yang sedang buka pendaftaran (berdasarkan tanggal)
    const now = new Date();
    const allDufahs = await prisma.dufah.findMany();
    const dufahTarget = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    // Kumpulkan ID dufah yang relevan (aktif + target pendaftaran)
    const relevantDufahIds = [dufahAktif.id];
    if (dufahTarget && dufahTarget.id !== dufahAktif.id) {
      relevantDufahIds.push(dufahTarget.id);
    }

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahAktif.id } },
      orderBy: { id: 'desc' }
    });

    // Tarik semua data riwayat yang butuh kamar dari dufah aktif DAN dufah target
    const antrean = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: { in: relevantDufahIds },
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