import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fungsi bantuan untuk menghasilkan NIS: Duf'ah + DDMMYY + Urut
async function generateNIS(tx: any, dufahId: number, tanggalLahir: Date) {
  const dufahPrefix = dufahId.toString().padStart(2, '0');
  const dd = tanggalLahir.getDate().toString().padStart(2, '0');
  const mm = (tanggalLahir.getMonth() + 1).toString().padStart(2, '0');
  const yy = tanggalLahir.getFullYear().toString().slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  
  // Cari nomor urut terakhir di dufah ini
  const lastSantri = await tx.santri.findFirst({
    where: { nis: { startsWith: `${dufahPrefix}${dateStr}` } },
    orderBy: { nis: 'desc' }
  });

  let urut = 1;
  if (lastSantri && lastSantri.nis) {
    const lastUrut = parseInt(lastSantri.nis.slice(-3));
    urut = lastUrut + 1;
  }
  
  return `${dufahPrefix}${dateStr}${urut.toString().padStart(3, '0')}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId, isKSU = false } = body; // isKSU dikirim true jika lewat jalur Bypass KSU

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID wajib diisi" }, { status: 400 });
    }

    const transaksi = await prisma.transaksiPendaftaran.findUnique({
      where: { id },
      include: { santri: true, program: true }
    });

    if (!transaksi || transaksi.statusPembayaran !== "PENDING") {
      return NextResponse.json({ error: "Transaksi tidak ditemukan atau sudah diproses" }, { status: 400 });
    }

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json({ error: "Tidak ada Duf'ah aktif" }, { status: 400 });
    }

    // Jalankan transaksi database (ACID)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Status Transaksi
      const finalStatus = isKSU ? "KSU_GRATIS" : "PAID";
      await tx.transaksiPendaftaran.update({
        where: { id: transaksi.id },
        data: {
          statusPembayaran: finalStatus,
          diverifikasiOleh: adminId,
          waktuLunas: new Date()
        }
      });

      // 2. Generate NIS jika belum punya
      let nis = transaksi.santri.nis;
      if (!nis && transaksi.santri.tanggalLahir) {
        nis = await generateNIS(tx, dufahAktif.id, new Date(transaksi.santri.tanggalLahir));
      }

      // 3. Kalkulasi Batas Aktif Duf'ah
      const santriDb = await tx.santri.findUnique({ where: { id: transaksi.santriId } });
      const currentBatas = santriDb?.batasAktifDufah || 0;
      
      let newBatasAktif = currentBatas;
      if (isKSU) {
        newBatasAktif = dufahAktif.id + 12; // KSU diberi batas +12 bulan dari sekarang (Bisa diperpanjang admin nanti)
      } else {
        // Jika santri mati (batasAktif < dufahAktif), mulai dari dufah aktif. 
        // Jika masih aktif, tambahkan ke batas aktif lama.
        const startDufah = currentBatas < dufahAktif.id ? dufahAktif.id : currentBatas + 1;
        newBatasAktif = startDufah + transaksi.program.durasiBulan - 1;
      }

      // 4. Update Santri
      const santriUpdate = await tx.santri.update({
        where: { id: transaksi.santriId },
        data: {
          nis,
          batasAktifDufah: newBatasAktif,
          isAktif: true,
          kategori: isKSU ? "KSU" : santriDb?.kategori
        }
      });

      // 5. Buat Riwayat Duf'ah untuk bulan berjalan jika belum ada
      const cekRiwayat = await tx.riwayatDufah.findUnique({
        where: {
          santriId_dufahId: { santriId: transaksi.santriId, dufahId: dufahAktif.id }
        }
      });

      if (!cekRiwayat) {
        await tx.riwayatDufah.create({
          data: {
            santriId: transaksi.santriId,
            dufahId: dufahAktif.id,
            status: "PRE_LIST", // Masuk ke antrean Asrama
            bulanKe: 1
          }
        });
      }

      return santriUpdate;
    });

    // TODO: Kirim WhatsApp Gateway di sini menggunakan FONNTE_API_KEY
    
    return NextResponse.json({
      message: "Verifikasi berhasil. Santri telah masuk antrean asrama.",
      data: result
    });

  } catch (error: any) {
    console.error("Error Verifikasi:", error);
    return NextResponse.json({ error: "Gagal memverifikasi", details: error.message }, { status: 500 });
  }
}
