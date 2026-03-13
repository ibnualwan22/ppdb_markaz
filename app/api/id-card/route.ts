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
      orderBy: { santri: { nama: 'asc' } }
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
    const { id } = await request.json(); 
    const updated = await prisma.riwayatDufah.update({
      where: { id },
      data: { 
        isIdCardTaken: true,
        waktuAmbilKartu: new Date()
      },
      include: { santri: { select: { nama: true } } }
    });

    emitDataUpdate("id-card");
    emitNotification("idcard", `💳 ${updated.santri.nama} telah menerima ID Card`, { nama: updated.santri.nama });

    return NextResponse.json({ message: "ID Card berhasil diserahkan" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal verifikasi" }, { status: 500 });
  }
}