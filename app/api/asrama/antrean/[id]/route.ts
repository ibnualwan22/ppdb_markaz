import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const riwayat = await prisma.riwayatDufah.findUnique({
      where: { id },
      include: {
        santri: {
          select: { id: true, nama: true, kategori: true, gender: true, nis: true, kabupaten: true }
        }
      }
    });

    if (!riwayat) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: riwayat.dufahId } },
      orderBy: { id: 'desc' }
    });

    let keteranganSakanLama = "";
    if (dufahLama) {
      const historiLama = await prisma.riwayatDufah.findFirst({
        where: {
          santriId: riwayat.santriId,
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

    return NextResponse.json({
      ...riwayat,
      keteranganSakanLama
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data antrean" }, { status: 500 });
  }
}
