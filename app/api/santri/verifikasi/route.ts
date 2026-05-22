import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity, emitDataUpdate } from "@/app/lib/pusherServer";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userSession = session?.user as any;

    if (!session || userSession?.role !== "SANTRI") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nis = userSession.username;
    const body = await request.json();
    const { nama, tempatLahir, tanggalLahir, namaOrtu } = body;

    if (!nama || !tempatLahir || !tanggalLahir || !namaOrtu) {
      return NextResponse.json({ error: "Semua kolom data diri wajib diisi" }, { status: 400 });
    }

    // 1. Ambil data santri saat ini
    const santri = await prisma.santri.findUnique({
      where: { nis }
    });

    if (!santri) {
      return NextResponse.json({ error: "Data santri tidak ditemukan" }, { status: 404 });
    }

    // 2. Cegah jika data sudah divalidasi sebelumnya
    if (santri.isDataVerified) {
      return NextResponse.json({ error: "Data diri Anda sudah terverifikasi sebelumnya dan tidak dapat diubah lagi." }, { status: 400 });
    }

    // 3. Update data diri dan ubah status verifikasi menjadi true
    const updatedSantri = await prisma.santri.update({
      where: { id: santri.id },
      data: {
        nama,
        tempatLahir,
        tanggalLahir: new Date(tanggalLahir),
        namaOrtu,
        isDataVerified: true
      }
    });

    // 4. Log Aktivitas
    const pelaku = `${updatedSantri.nama} (@${nis})`;
    await logActivity({
      aksi: "UPDATE",
      modul: "Santri",
      deskripsi: `Santri melakukan verifikasi & penguncian data diri mandiri.`,
      namaUser: pelaku,
      userId: userSession.id,
      targetId: santri.id,
    });

    emitDataUpdate("santri-edit");

    return NextResponse.json({
      success: true,
      message: "Data diri berhasil diverifikasi dan dikunci.",
      data: updatedSantri
    });
  } catch (error) {
    console.error("Error verifikasi data santri:", error);
    return NextResponse.json({ error: "Gagal memproses verifikasi data" }, { status: 500 });
  }
}
