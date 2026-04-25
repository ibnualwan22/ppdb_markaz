import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // KIRIM NOTIFIKASI JIKA CHECK OUT
    if (isAktif === false) {
      await sendGlobalNotification(
        "Santri Check Out 🚪",
        `Santri a.n ${santriUpdate.nama} telah check out. Kamar/Lemari telah dikosongkan.`,
        "receive_notif_status_santri",
        "/admin/santri"
      );
    } else {
      await sendGlobalNotification(
        "Santri Diaktifkan Kembali ✅",
        `Status Santri a.n ${santriUpdate.nama} telah diaktifkan kembali.`,
        "receive_notif_status_santri",
        "/admin/santri"
      );
    }

    emitDataUpdate("santri-status");

    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    const pelaku = u ? `${u.name} (@${u.username})` : "Admin";

    await logActivity({
      aksi: "UPDATE",
      modul: "Santri",
      deskripsi: isAktif === false 
        ? `Check Out santri a.n ${santriUpdate.nama} — Kamar dikosongkan`
        : `Mengaktifkan kembali santri a.n ${santriUpdate.nama}`,
      namaUser: pelaku,
      userId: u?.id,
      targetId: id,
    });

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

    const session2 = await getServerSession(authOptions);
    const u2 = session2?.user as any;
    const pelaku2 = u2 ? `${u2.name} (@${u2.username})` : "Admin";

    await logActivity({
      aksi: "UPDATE",
      modul: "Santri",
      deskripsi: `Mengedit data santri a.n ${santriUpdate.nama}`,
      namaUser: pelaku2,
      userId: u2?.id,
      targetId: id,
    });

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

    const session3 = await getServerSession(authOptions);
    const u3 = session3?.user as any;
    const pelaku3 = u3 ? `${u3.name} (@${u3.username})` : "Admin";

    await logActivity({
      aksi: "DELETE",
      modul: "Santri",
      deskripsi: `Menghapus santri dengan ID: ${id}`,
      namaUser: pelaku3,
      userId: u3?.id,
      targetId: id,
    });

    return NextResponse.json({ message: "Santri berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus santri" }, { status: 500 });
  }
}