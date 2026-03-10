import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Tambahkan kategori dan bulanKe untuk keperluan rilis perdana
    const { nama, lemariId, kategori, bulanKe } = body; 

    if (!nama || !lemariId || !kategori) {
      return NextResponse.json({ error: "Nama, Kategori, dan Lemari wajib diisi" }, { status: 400 });
    }

    const dufahAktif = await prisma.dufah.findFirst({
      where: { isActive: true },
    });

    if (!dufahAktif) {
      return NextResponse.json({ error: "Tidak ada Duf'ah yang aktif." }, { status: 400 });
    }

    // CEK KAPASITAS LEMARI (1 Lemari = 1 Orang)
    const cekLemari = await prisma.riwayatDufah.findFirst({
      where: {
        lemariId: lemariId,
        dufahId: dufahAktif.id
      }
    });

    if (cekLemari) {
      return NextResponse.json({ error: "Gagal: Lemari ini sudah terisi oleh orang lain di bulan ini!" }, { status: 400 });
    }

    // EKSEKUSI PEMBUATAN DATA
    // Jika panitia mengisi bulanKe = 2, kita bisa memanipulasi riwayatnya (opsional) atau menyimpannya di frontend.
    // Untuk saat ini, kita buat santrinya dan langsung tempatkan di lemari.
    const santriBaru = await prisma.santri.create({
      data: {
        nama: nama,
        kategori: kategori, // Bisa "BARU", "LAMA", atau "KSU" sesuai pilihan panitia
        isAktif: true,
        riwayat: {
          create: {
            dufahId: dufahAktif.id,
            lemariId: lemariId,
            status: "ASSIGNED",
            isIdCardTaken: false,
          }
        }
      },
      include: { riwayat: true }
    });

    return NextResponse.json({
      message: `${nama} (Kategori: ${kategori}) berhasil didaftarkan ke lemari.`,
      data: santriBaru
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data ke asrama" }, { status: 500 });
  }
}