import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, lemariId } = body; // Kategori otomatis "BARU" untuk form ini

    if (!nama || !lemariId) {
      return NextResponse.json({ error: "Nama dan Pilihan Lemari wajib diisi" }, { status: 400 });
    }

    // 1. Cari Duf'ah yang sedang aktif
    const dufahAktif = await prisma.dufah.findFirst({
      where: { isActive: true },
    });

    if (!dufahAktif) {
      return NextResponse.json({ error: "Tidak ada periode Duf'ah yang aktif." }, { status: 400 });
    }

    // 2. Eksekusi: Buat Data Santri & Riwayat sekaligus (Nested Create)
    const santriBaru = await prisma.santri.create({
      data: {
        nama: nama,
        kategori: "BARU", // Hardcode karena ini khusus jalur santri baru
        riwayat: {
          create: {
            dufahId: dufahAktif.id,
            lemariId: lemariId,    // Langsung assign ke lemari (misal: A1)
            status: "ASSIGNED",    // Statusnya langsung punya kamar
            isIdCardTaken: false,  // Tinggal nunggu diambil di meja ID Card
          }
        }
      },
      // Kembalikan data riwayatnya juga agar bisa dikonfirmasi di frontend
      include: {
        riwayat: true 
      }
    });

    return NextResponse.json({
      message: `${nama} berhasil didaftarkan dan diberikan penempatan kamar.`,
      data: santriBaru
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data santri baru" }, { status: 500 });
  }
}