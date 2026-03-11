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

    const cekSudahDaftar = await prisma.riwayatDufah.findUnique({
      where: { santriId_dufahId: { santriId, dufahId: dufahAktif.id } },
    });
    if (cekSudahDaftar) return NextResponse.json({ error: "Anda sudah terdaftar" }, { status: 400 });

    // ==========================================
    // LOGIKA BARU: BACA KOLOM "bulanKe"
    // ==========================================
    
    // 1. Ambil data kamar BULAN LALU (Duf'ah terakhir)
    const riwayatBulanLalu = await prisma.riwayatDufah.findFirst({
      where: { santriId: santriId, lemariId: { not: null } },
      orderBy: { dufahId: 'desc' },
    });

    const batasMaksimal = dataSantri.kategori === "KSU" ? 12 : 3;
    
    let lemariBaru = null;
    let statusBaru = "PRE_LIST"; 
    let bulanKeBaru = 1;

    // Jika bulan lalu dia punya kamar, mari kita cek durasinya
    if (riwayatBulanLalu) {
      const durasiBerjalan = riwayatBulanLalu.bulanKe; // Ambil durasi dari database

      if (durasiBerjalan < batasMaksimal) {
        // BELUM LIMIT: Perpanjang kamarnya, tambahkan 1 bulan
        lemariBaru = riwayatBulanLalu.lemariId;
        statusBaru = "ASSIGNED";
        bulanKeBaru = durasiBerjalan + 1;
      } else {
        // SUDAH LIMIT (Contoh: sudah bulan ke-3): Kosongkan kamarnya
        lemariBaru = null;
        statusBaru = "PRE_LIST";
        bulanKeBaru = 1; // Reset jadi 1 untuk persiapan kamar barunya nanti
      }
    }

    // Eksekusi Pendaftaran
    const pendaftaranBerhasil = await prisma.riwayatDufah.create({
      data: {
        santriId: santriId,
        dufahId: dufahAktif.id,
        lemariId: lemariBaru, 
        status: statusBaru,
        isIdCardTaken: false,
        bulanKe: bulanKeBaru // Simpan durasi terbarunya
      },
    });

    const pesan = statusBaru === "ASSIGNED" 
      ? `Sakan diperpanjang. (Bulan ke-${bulanKeBaru})` 
      : "Masa tinggal habis, silakan menuju Meja Asrama untuk Sakan baru.";

    return NextResponse.json({ message: pesan, data: pendaftaranBerhasil }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}