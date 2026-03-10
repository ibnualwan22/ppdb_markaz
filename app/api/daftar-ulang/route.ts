import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==========================================
// 1. GET: Fitur Pencarian Nama (Auto-suggest)
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("nama");

    if (!keyword) {
      return NextResponse.json({ error: "Masukkan nama untuk mencari" }, { status: 400 });
    }

    // Mencari santri berdasarkan nama yang diketik (minimal 3 huruf disarankan di frontend)
    const hasilPencarian = await prisma.santri.findMany({
      where: {
        nama: {
          contains: keyword,
          mode: "insensitive", // Mengabaikan huruf besar/kecil (khusus PostgreSQL)
        },
      },
      // Hanya tampilkan id, nama, dan kategori agar data yang dikirim ringan
      select: {
        id: true,
        nama: true,
        kategori: true,
      },
      take: 10, // Batasi maksimal 10 nama agar tidak membebani server
    });

    return NextResponse.json(hasilPencarian);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencari nama" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Eksekusi Pendaftaran (Submit)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { santriId } = body;

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ error: "Pendaftaran ditutup." }, { status: 403 });

    const dataSantri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!dataSantri) return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });

    // Cek apakah sudah daftar di bulan ini
    const cekSudahDaftar = await prisma.riwayatDufah.findUnique({
      where: { santriId_dufahId: { santriId, dufahId: dufahAktif.id } },
    });
    if (cekSudahDaftar) return NextResponse.json({ error: "Anda sudah terdaftar" }, { status: 400 });

    // ==========================================
    // LOGIKA BARU: PENGHITUNG MASA TINGGAL (ROLLING)
    // ==========================================
    
    // 1. Ambil riwayat penempatan lemari santri ke belakang (maksimal 12 bulan terakhir)
    const riwayatLama = await prisma.riwayatDufah.findMany({
      where: { santriId: santriId, lemariId: { not: null } },
      orderBy: { dufahId: 'desc' },
      take: 12
    });

    let lemariTerakhir = riwayatLama.length > 0 ? riwayatLama[0].lemariId : null;
    let hitungBulanBeruntun = 0;

    // 2. Hitung berapa kali berturut-turut dia di lemari yang sama
    if (lemariTerakhir) {
      for (const riwayat of riwayatLama) {
        if (riwayat.lemariId === lemariTerakhir) {
          hitungBulanBeruntun++;
        } else {
          break; // Berhenti menghitung jika lemarinya beda
        }
      }
    }

    // 3. Tentukan batas maksimal berdasarkan kategori
    const batasMaksimal = dataSantri.kategori === "KSU" ? 12 : 3;
    
    // 4. Putuskan Status dan Lemari Baru
    let lemariBaru = null;
    let statusBaru = "PRE_LIST"; // Default: Harus cari kamar baru

    // Jika belum melewati batas maksimal, otomatis perpanjang lemari yang sama
    if (lemariTerakhir && hitungBulanBeruntun < batasMaksimal) {
      lemariBaru = lemariTerakhir;
      statusBaru = "ASSIGNED";
    }

    // ==========================================

    // Eksekusi Pendaftaran
    const pendaftaranBerhasil = await prisma.riwayatDufah.create({
      data: {
        santriId: santriId,
        dufahId: dufahAktif.id,
        lemariId: lemariBaru, // Akan terisi otomatis jika belum 3 bulan, dan null jika sudah waktunya rolling
        status: statusBaru,
        isIdCardTaken: false,
      },
    });

    const pesan = statusBaru === "ASSIGNED" 
      ? "Pendaftaran berhasil. Sakan Anda otomatis diperpanjang." 
      : "Pendaftaran berhasil. Masa tinggal Anda habis, silakan menuju Meja Asrama untuk Sakan baru.";

    return NextResponse.json({ message: pesan, data: pendaftaranBerhasil }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}