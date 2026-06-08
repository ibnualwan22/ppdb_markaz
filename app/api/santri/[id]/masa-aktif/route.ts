import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emitDataUpdate } from "@/app/lib/pusherServer";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session: any = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check permission: edit_masa_aktif or all_access
  const permissions: string[] = session.user?.permissions || [];
  if (!permissions.includes("edit_masa_aktif") && !permissions.includes("all_access")) {
    return NextResponse.json({ error: "Anda tidak memiliki izin untuk mengedit masa aktif." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { batasAktifDufah } = body;

    if (batasAktifDufah === undefined || batasAktifDufah === null) {
      return NextResponse.json({ error: "batasAktifDufah wajib diisi." }, { status: 400 });
    }

    const newBatas = parseInt(batasAktifDufah, 10);
    if (isNaN(newBatas) || newBatas < 0) {
      return NextResponse.json({ error: "Nilai batasAktifDufah tidak valid." }, { status: 400 });
    }

    const santri = await prisma.santri.findUnique({ where: { id } });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan." }, { status: 404 });
    }

    // Update batasAktifDufah + pastikan isAktif = true jika batas mencakup dufah aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    const shouldBeActive = dufahAktif ? newBatas >= dufahAktif.id : false;

    const updated = await prisma.santri.update({
      where: { id },
      data: { 
        batasAktifDufah: newBatas,
        ...(shouldBeActive ? { isAktif: true } : {})
      },
    });

    // AUTO-CREATE RiwayatDufah untuk Duf'ah Aktif jika belum ada
    if (dufahAktif && newBatas >= dufahAktif.id) {
      const existingRiwayat = await prisma.riwayatDufah.findFirst({
        where: { santriId: id, dufahId: dufahAktif.id, status: { not: "CHECKED_OUT" } }
      });

      if (!existingRiwayat) {
        // Cari riwayat terakhir untuk mewarisi kamar
        const lastRiwayat = await prisma.riwayatDufah.findFirst({
          where: { santriId: id },
          orderBy: { dufahId: 'desc' }
        });

        await prisma.riwayatDufah.create({
          data: {
            santriId: id,
            dufahId: dufahAktif.id,
            lemariId: lastRiwayat?.lemariId || null,
            bulanKe: lastRiwayat ? (lastRiwayat.bulanKe || 1) + 1 : 1,
            isLunas: true,
            status: "PRE_LIST"
          }
        });
      }
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          aksi: "EDIT",
          modul: "Masa Aktif",
          deskripsi: `Edit Masa Aktif santri "${santri.nama}" dari Duf'ah ${santri.batasAktifDufah} → ${newBatas}`,
          namaUser: session.user?.nama || session.user?.name || "Admin",
          targetId: santri.id,
        },
      });
    } catch {}

    emitDataUpdate("masa-aktif-edit");

    return NextResponse.json({ success: true, batasAktifDufah: updated.batasAktifDufah });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal memperbarui masa aktif." }, { status: 500 });
  }
}
