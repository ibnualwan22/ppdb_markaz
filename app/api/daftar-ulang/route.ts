import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==========================================
// FUNGSI PENCARIAN (Mencari Santri Terkena Auto-CO)
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("nama");

    if (!keyword || keyword.length < 3) return NextResponse.json([]);

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json([]);

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahAktif.id } },
      orderBy: { id: 'desc' }
    });

    const santriDitemukan = await prisma.santri.findMany({
      where: {
        nama: { contains: keyword, mode: "insensitive" },
        kategori: "LAMA",
        riwayat: {
          none: { dufahId: dufahAktif.id } // Mutlak: Belum daftar bulan ini!
        },
        OR: [
          // JALUR 1 (Normal): Terkena Auto-CO dan aktif di bulan lalu
          {
            isAktif: false,
            riwayat: {
              some: { dufahId: dufahLama?.id || -1 }
            }
          },
          // JALUR 2 (Comeback): Diaktifkan manual oleh panitia dari Master Santri
          {
            isAktif: true
          }
        ]
      },
      take: 10,
      select: { id: true, nama: true, kategori: true }
    });

    return NextResponse.json(santriDitemukan);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencari data" }, { status: 500 });
  }
}

// ==========================================
// FUNGSI SUBMIT PENDAFTARAN (Pembangkit Status)
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { santriId } = body;

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ error: "Pendaftaran ditutup." }, { status: 403 });

    const dataSantri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!dataSantri) return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });

    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahAktif.id } },
      orderBy: { id: 'desc' }
    });

    let riwayatBulanLalu = null;
    if (dufahLama) {
      riwayatBulanLalu = await prisma.riwayatDufah.findUnique({
        where: { santriId_dufahId: { santriId: santriId, dufahId: dufahLama.id } }
      });
    }

    const batasMaksimal = 3;
    let lemariBaru = null;
    let statusBaru = "PRE_LIST"; 
    let bulanKeBaru = 1;
    let kategoriBaru = dataSantri.kategori; // Default kategori tetap

    // Logika Terputus & Reset
    if (riwayatBulanLalu && riwayatBulanLalu.lemariId) {
      // TIDAK TERPUTUS
      const durasiBerjalan = riwayatBulanLalu.bulanKe;
      if (durasiBerjalan < batasMaksimal) {
        lemariBaru = riwayatBulanLalu.lemariId;
        statusBaru = "ASSIGNED";
        bulanKeBaru = durasiBerjalan + 1;
      } else {
        lemariBaru = null;
        statusBaru = "PRE_LIST";
        bulanKeBaru = 1; 
      }
    } else {
      // TERPUTUS! Hukumannya: Reset kamar, Reset bulan, Reset Kategori
      lemariBaru = null;
      statusBaru = "PRE_LIST";
      bulanKeBaru = 1;
      kategoriBaru = "BARU"; // <--- INI OBATNYA
    }

    const pendaftaranBerhasil = await prisma.riwayatDufah.create({
      data: {
        santriId: santriId,
        dufahId: dufahAktif.id,
        lemariId: lemariBaru, 
        status: statusBaru,
        isIdCardTaken: false,
        bulanKe: bulanKeBaru 
      },
    });

    // BANGKITKAN STATUS SEKALIGUS UPDATE KATEGORI
    await prisma.santri.update({
      where: { id: santriId },
      data: { 
        isAktif: true,
        kategori: kategoriBaru 
      }
    });

    const pesan = statusBaru === "ASSIGNED" 
      ? `Sakan diperpanjang. (Bulan ke-${bulanKeBaru})` 
      : "Silakan menuju Meja Asrama untuk antrean Sakan baru.";

    return NextResponse.json({ message: pesan, data: pendaftaranBerhasil }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem." }, { status: 500 });
  }
}