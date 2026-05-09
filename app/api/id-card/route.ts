import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, emitNotification } from "@/app/lib/pusherServer";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ belum: [], sudah: [], dufahNama: "Tidak ada Duf'ah Aktif" });

    const belum = await prisma.riwayatDufah.findMany({
      where: { 
        dufahId: dufahAktif.id, 
        lemariId: { not: null }, 
        isIdCardTaken: false, 
        santri: { kategori: { not: 'KSU' } } 
      },
      include: { 
        santri: { select: { id: true, nama: true, kategori: true, gender: true } }, 
        lemari: { include: { kamar: { include: { sakan: true } } } } 
      },
      orderBy: { updatedAt: 'desc' }
    });

    const sudah = await prisma.riwayatDufah.findMany({
      where: { 
        dufahId: dufahAktif.id, 
        lemariId: { not: null }, 
        isIdCardTaken: true, 
        santri: { kategori: { not: 'KSU' } } 
      },
      include: { 
        santri: { select: { id: true, nama: true, kategori: true, gender: true } }, 
        lemari: { include: { kamar: { include: { sakan: true } } } } 
      },
      orderBy: { waktuAmbilKartu: 'asc' } // ← yang pertama ambil = No. 1
    });

    return NextResponse.json({ belum, sudah, dufahNama: dufahAktif.nama });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, customNomor } = await request.json(); 

    // Gunakan Transaction untuk mencegah Race Condition saat pembuatan nomor urut
    const updated = await prisma.$transaction(async (tx) => {
      const riwayatCurrent = await tx.riwayatDufah.findUnique({ where: { id } });
      if (!riwayatCurrent) throw new Error("Data riwayat tidak ditemukan");

      let nextNomor = customNomor ? parseInt(customNomor, 10) : null;

      if (nextNomor) {
        const isTaken = await tx.riwayatDufah.findFirst({
          where: { dufahId: riwayatCurrent.dufahId, nomorIdCard: nextNomor }
        });
        if (isTaken) throw new Error("CUSTOM_TAKEN");
      } else {
        // Cari nomor ID Card tertinggi di Duf'ah yang sama
        const maxData = await tx.riwayatDufah.aggregate({
          where: { dufahId: riwayatCurrent.dufahId },
          _max: { nomorIdCard: true }
        });
        nextNomor = (maxData._max.nomorIdCard || 0) + 1;
      }

      return await tx.riwayatDufah.update({
        where: { id },
        data: { 
          isIdCardTaken: true,
          waktuAmbilKartu: new Date(),
          nomorIdCard: nextNomor
        },
        include: { santri: { select: { nama: true } } }
      });
    });

    emitDataUpdate("id-card");
    emitNotification("idcard", `💳 [No. ${updated.nomorIdCard}] ${updated.santri.nama} telah menerima ID Card`, { nama: updated.santri.nama });

    return NextResponse.json({ message: "ID Card berhasil diserahkan", data: updated });
  } catch (error: any) {
    console.error("Error in PATCH /api/id-card:", error);
    if (error.message === "CUSTOM_TAKEN") {
      return NextResponse.json({ error: "Nomor ID Card custom tersebut sudah dipakai." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal verifikasi" }, { status: 500 });
  }
}