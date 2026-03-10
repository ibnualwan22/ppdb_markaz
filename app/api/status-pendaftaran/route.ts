import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi GET: Mengecek status pendaftaran saat ini
export async function GET() {
  try {
    // 1. Cari Duf'ah yang sedang aktif saat ini
    const dufahAktif = await prisma.dufah.findFirst({
      where: {
        isActive: true,
      },
    });

    // Jika tidak ada Duf'ah yang diset aktif oleh Ketua/Muasis
    if (!dufahAktif) {
      return NextResponse.json({
        isOpen: false,
        message: "Saat ini tidak ada periode Duf'ah yang aktif.",
      });
    }

    const waktuSekarang = new Date();
    const { tanggalBuka, tanggalTutup, nama, id } = dufahAktif;

    // 2. Logika Pengecekan Waktu (Time-Bound)
    // Jika tanggal buka ada, dan waktu sekarang MASIH KURANG dari tanggal buka
    if (tanggalBuka && waktuSekarang < tanggalBuka) {
      return NextResponse.json({
        isOpen: false,
        message: `Pendaftaran ulang untuk ${nama} belum dibuka.`,
        bukaPada: tanggalBuka,
      });
    }

    // Jika tanggal tutup ada, dan waktu sekarang SUDAH LEWAT dari tanggal tutup
    if (tanggalTutup && waktuSekarang > tanggalTutup) {
      return NextResponse.json({
        isOpen: false,
        message: `Mohon maaf, waktu pendaftaran ulang untuk ${nama} telah ditutup.`,
      });
    }

    // 3. Jika lolos semua pengecekan di atas, berarti PENDAFTARAN DIBUKA
    return NextResponse.json({
      isOpen: true,
      message: `Pendaftaran ulang ${nama} sedang berlangsung.`,
      dufahId: id, // ID ini penting untuk dikirim balik saat santri men-submit form
      namaDufah: nama,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengecek status pendaftaran" },
      { status: 500 }
    );
  }
}