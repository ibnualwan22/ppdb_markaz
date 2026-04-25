import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ data: [], dufahNama: "Tidak ada Duf'ah Aktif" });

    // Cari juga Duf'ah yang sedang buka pendaftaran (berdasarkan tanggal)
    const now = new Date();
    const allDufahs = await prisma.dufah.findMany();
    const dufahTarget = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    // Kumpulkan ID dufah yang relevan
    // PRIORITAS: Hanya tampilkan yang aktif sekarang agar tidak tercampur dengan calon santri bulan depan.
    const relevantDufahIds = [dufahAktif.id];

    const data = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: { in: relevantDufahIds },
        bulanKe: 1, // Only santri baru (bulan pertama)
      },
      include: {
        santri: { select: { id: true, nama: true, gender: true, nis: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } }
      },
      orderBy: {
        nomorIdCard: { sort: 'asc', nulls: 'last' }
      }
    });

    const dufahLabel = dufahAktif.nama;

    return NextResponse.json({ data, dufahNama: dufahLabel });
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

    emitDataUpdate("mimstore");

    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    const pelaku = u ? `${u.name} (@${u.username})` : "Admin";

    await logActivity({
      aksi: "UPDATE",
      modul: "Mimstore",
      deskripsi: `Memperbarui atribut "${field}" menjadi "${value}" untuk santri ID: ${id}`,
      namaUser: pelaku,
      userId: u?.id,
      targetId: id,
    });

    return NextResponse.json({ message: "Berhasil diupdate", data: updated });
  } catch (error) {
    console.error("Error PATCH /api/mimstore:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}
