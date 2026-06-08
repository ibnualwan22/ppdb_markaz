import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const santri = await prisma.santri.findFirst({
      where: { nama: { contains: "Himmatul Ulya", mode: "insensitive" } },
      include: {
        riwayat: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri not found" });
    }

    const activeDufah = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!activeDufah) return NextResponse.json({ error: "No active dufah" });

    // Cek apakah dia punya riwayat di dufah aktif
    const currentRiwayat = santri.riwayat.find(r => r.dufahId === activeDufah.id);
    
    if (currentRiwayat) {
      // Jika sudah ada, tapi isLunas false, update jadi true
      if (!currentRiwayat.isLunas) {
        const updated = await prisma.riwayatDufah.update({
          where: { id: currentRiwayat.id },
          data: { isLunas: true }
        });
        return NextResponse.json({ success: true, message: "Updated isLunas to true", updated });
      }
      return NextResponse.json({ success: true, message: "Riwayat sudah ada dan sudah lunas", data: currentRiwayat });
    } else {
      // Jika belum ada riwayat untuk dufah aktif, buatkan dengan mewarisi lemari dari riwayat sebelumnya
      const prevRiwayat = santri.riwayat[0]; // Riwayat terbaru (karena orderBy desc)
      
      const newRiwayat = await prisma.riwayatDufah.create({
        data: {
          santriId: santri.id,
          dufahId: activeDufah.id,
          lemariId: prevRiwayat ? prevRiwayat.lemariId : null,
          bulanKe: prevRiwayat ? (prevRiwayat.bulanKe || 1) + 1 : 1,
          isLunas: true, // Karena durasi sudah ditambah manual
          status: "PRE_LIST"
        }
      });
      return NextResponse.json({ success: true, message: "Created new Riwayat for active Dufah", newRiwayat });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
