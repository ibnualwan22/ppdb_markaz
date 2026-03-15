import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ data: [], dufahNama: "Tidak ada Duf'ah Aktif" });

    const data = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: dufahAktif.id,
        bulanKe: 1, // Only santri baru (bulan pertama)
      },
      include: {
        santri: { select: { id: true, nama: true, gender: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } }
      },
      orderBy: {
        nomorIdCard: { sort: 'asc', nulls: 'last' }
      }
    });

    return NextResponse.json({ data, dufahNama: dufahAktif.nama });
  } catch (error) {
    console.error("Error GET /api/mimstore:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, field, value } = body;

    // Allowed fields to prevent unauthorized updates
    const allowedFields = [
      'isDresscodeTaken',
      'ukuranDresscode',
      'isToteBagTaken',
      'isPinTaken',
      'isSongkokKhimarTaken',
      'ukuranSongkok',
      'isMalzamahTaken',
      'isTabirotTaken'
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Field tidak valid" }, { status: 400 });
    }

    const updated = await prisma.riwayatDufah.update({
      where: { id },
      data: { [field]: value }
    });

    return NextResponse.json({ message: "Berhasil diupdate", data: updated });
  } catch (error) {
    console.error("Error PATCH /api/mimstore:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}
