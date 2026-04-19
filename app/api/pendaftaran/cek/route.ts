import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier"); // NIK atau NIS
    const dob = searchParams.get("dob"); // YYYY-MM-DD

    if (!identifier || !dob) {
      return NextResponse.json({ error: "Parameter identifier dan dob wajib diisi" }, { status: 400 });
    }

    const inputDate = new Date(dob);

    const santri = await prisma.santri.findFirst({
      where: {
        nis: identifier
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Data Santri tidak ditemukan" }, { status: 404 });
    }

    // Validasi Tanggal Lahir (Security Check)
    if (santri.tanggalLahir?.toISOString().split('T')[0] !== inputDate.toISOString().split('T')[0]) {
      return NextResponse.json({ error: "Tanggal lahir tidak cocok" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Data ditemukan",
      data: {
        id: santri.id,
        nama: santri.nama,
        nis: santri.nis,
        kategori: santri.kategori,
        isAktif: santri.isAktif,
        batasAktifDufah: santri.batasAktifDufah
      }
    });
  } catch (error: any) {
    console.error("Error cek santri:", error);
    return NextResponse.json({ error: "Gagal memverifikasi data" }, { status: 500 });
  }
}
