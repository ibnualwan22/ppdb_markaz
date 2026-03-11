import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    
    // --- 1. DATA KARTU STATISTIK (DUF'AH AKTIF) ---
    let stats = {
      dufahNama: dufahAktif ? dufahAktif.nama : "Tidak ada Duf'ah Aktif",
      totalMasukSakan: 0,
      totalAmbilIdCard: 0,
      selisih: 0,
      listBelumIdCard: [] as any[]
    };

    if (dufahAktif) {
      // Jumlah santri yang SUDAH PUNYA LEMARI (KSU, LAMA, BARU)
      stats.totalMasukSakan = await prisma.riwayatDufah.count({
        where: { dufahId: dufahAktif.id, lemariId: { not: null } }
      });

      // Jumlah yang sudah punya lemari DAN sudah ambil ID Card
      stats.totalAmbilIdCard = await prisma.riwayatDufah.count({
        where: { dufahId: dufahAktif.id, lemariId: { not: null }, isIdCardTaken: true }
      });

      // Selisih (Mereka yang nyangkut di asrama tapi belum ke meja ID Card)
      stats.selisih = stats.totalMasukSakan - stats.totalAmbilIdCard;

      // Ambil detail nama santri yang jadi "Selisih"
      stats.listBelumIdCard = await prisma.riwayatDufah.findMany({
        where: { dufahId: dufahAktif.id, lemariId: { not: null }, isIdCardTaken: false },
        include: {
          santri: { select: { nama: true, kategori: true } },
          lemari: { include: { kamar: { include: { sakan: true } } } }
        },
        orderBy: { santri: { nama: 'asc' } }
      });
    }

    // --- 2. DATA GRAFIK HISTORIS (SEMUA DUF'AH) ---
    const historiDufahRaw = await prisma.dufah.findMany({
      select: {
        id: true,
        nama: true,
        tanggalBuka: true,
        _count: {
          select: { riwayat: true } // Hitung total pendaftar per Duf'ah
        }
      },
      orderBy: { id: 'asc' }
    });

    const grafikData = historiDufahRaw.map(d => ({
      id: d.id,
      nama: d.nama,
      // Ambil tahun dari tanggalBuka, jika null pakai tahun sekarang
      tahun: d.tanggalBuka ? new Date(d.tanggalBuka).getFullYear() : new Date().getFullYear(),
      totalPendaftar: d._count.riwayat
    }));

    return NextResponse.json({ stats, grafikData });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
  }
}