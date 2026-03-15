import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate } from "@/app/lib/pusherServer";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isAktif } = body;

    // 1. Update profil utamanya
    const santriUpdate = await prisma.santri.update({
      where: { id },
      data: { isAktif }
    });

    // 2. LOGIKA PENGUSIRAN KAMAR
    if (isAktif === false) {
      const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
      
      if (dufahAktif) {
        await prisma.riwayatDufah.updateMany({
          where: {
            santriId: id,
            dufahId: dufahAktif.id
          },
          data: {
            lemariId: null,
            status: "PRE_LIST"
          }
        });
      }
    }

    emitDataUpdate("santri-status");
    return NextResponse.json({ message: "Status berhasil diubah", data: santriUpdate });
  } catch (error) {
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}

// PUT: Update data santri (nama, kategori, gender)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, kategori, gender, riwayatId, bulanKe, nomorIdCard } = body;

    const santriUpdate = await prisma.santri.update({
      where: { id },
      data: { 
        ...(nama && { nama }),
        ...(kategori && { kategori }),
        ...(gender && { gender }),
      }
    });

    if (riwayatId && (bulanKe !== undefined || nomorIdCard !== undefined)) {
      await prisma.riwayatDufah.update({
        where: { id: riwayatId },
        data: {
          ...(bulanKe !== undefined && { bulanKe: Number(bulanKe) }),
          ...(nomorIdCard !== undefined && { nomorIdCard: nomorIdCard === "" ? null : Number(nomorIdCard) }),
        }
      });
    }

    emitDataUpdate("santri-edit");
    return NextResponse.json({ message: "Data santri berhasil diperbarui", data: santriUpdate });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memperbarui data santri" }, { status: 500 });
  }
}

// DELETE: Hapus santri beserta semua riwayatnya
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.santri.delete({
      where: { id }
    });

    emitDataUpdate("santri-delete");
    return NextResponse.json({ message: "Santri berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus santri" }, { status: 500 });
  }
}