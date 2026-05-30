import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";


function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `RENEW-${dufahId}-${dateString}-${randomStr}`;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi setelah 5 menit." }, { status: 429 });
    }

    const body = await request.json();
    const { santriId, programId, isBeliAtribut } = body;

    if (!santriId || !programId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'asc' } });
    const now = new Date();
    
    // Cari Dufah yang rentang pendaftarannya mencakup waktu saat ini
    const targetDufah = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    if (!targetDufah) {
      return NextResponse.json({ error: "Pendaftaran saat ini sedang ditutup. Tidak ada periode Duf'ah yang buka." }, { status: 400 });
    }

    const santri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    const dufahTujuanId = targetDufah.id;

    // Cek apakah santri masih memiliki sisa paket
    const isKlaimPaket = santri.batasAktifDufah >= dufahTujuanId;

    // Jika klaim paket otomatis 0, jika tidak beli atribut potong 100k
    const nominalProgram = isKlaimPaket ? 0 : (isBeliAtribut ? program.harga : Math.max(0, program.harga - 100000));
    const kodeUnik = isKlaimPaket ? 0 : (Math.floor(Math.random() * 900) + 100);
    const totalTagihan = nominalProgram + kodeUnik;
    
    const statusPembayaran = isKlaimPaket ? "KLAIM_PAKET" : "PENDING";
    const waktuLunas = isKlaimPaket ? new Date() : null;

    // Acuan kamar sebelumnya tempat dia menetap adalah Duf'ah sebelum dufahTujuan ini
    const dufahLama = await prisma.dufah.findFirst({
      where: { id: { lt: dufahTujuanId } },
      orderBy: { id: 'desc' }
    });

    let riwayatBulanLalu = null;
    if (dufahLama) {
      riwayatBulanLalu = await prisma.riwayatDufah.findUnique({
        where: { santriId_dufahId: { santriId, dufahId: dufahLama.id } }
      });
    }

    const batasMaksimal = 3;
    let lemariBaru = null;
    let statusBaru = "PRE_LIST";
    let bulanKeBaru = 1;

    if (riwayatBulanLalu && riwayatBulanLalu.lemariId) {
      const durasiBerjalan = riwayatBulanLalu.bulanKe;
      if (durasiBerjalan % batasMaksimal !== 0) {
        lemariBaru = riwayatBulanLalu.lemariId;
        statusBaru = "ASSIGNED";
        bulanKeBaru = durasiBerjalan + 1;
      } else {
        lemariBaru = null;
        statusBaru = "PRE_LIST";
        bulanKeBaru = durasiBerjalan + 1;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaksiPendaftaran.create({
        data: {
          noKwitansi: generateInvoiceNumber(dufahTujuanId),
          santriId,
          programId,
          dufahTujuanId,
          nominalProgram,
          kodeUnik,
          totalTagihan,
          statusPembayaran,
          waktuLunas
        }
      });

      // Buat riwayat jika belum ada untuk dufah tujuan agar terdeteksi booking/belum lunas di asrama
      const existingRiwayat = await tx.riwayatDufah.findUnique({
        where: { santriId_dufahId: { santriId, dufahId: dufahTujuanId } }
      });

      if (!existingRiwayat) {
        await tx.riwayatDufah.create({
          data: {
            santriId,
            dufahId: dufahTujuanId,
            lemariId: lemariBaru,
            status: statusBaru,
            isIdCardTaken: false,
            bulanKe: bulanKeBaru,
            isLunas: isKlaimPaket // Jika klaim, langsung lunas
          }
        });
      }

      return trx;
    });

    const transaksi = result;

    return NextResponse.json({
      message: "Tagihan perpanjangan berhasil diterbitkan.",
      data: { transaksi, program, dufah: targetDufah }
    });
  } catch (error: any) {
    console.error("Error renew:", error);
    return NextResponse.json({ error: "Gagal menerbitkan tagihan" }, { status: 500 });
  }
}
