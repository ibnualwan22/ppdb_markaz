import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const updated = await prisma.santri.update({
      where: { id },
      data: { batasAktifDufah: newBatas },
    });

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

    return NextResponse.json({ success: true, batasAktifDufah: updated.batasAktifDufah });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal memperbarui masa aktif." }, { status: 500 });
  }
}
