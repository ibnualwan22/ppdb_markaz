import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";

const prisma = new PrismaClient();

function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000); // 4 digit acak
  return `INV-${dufahId}-${dateString}-${randomStr}`;
}

function toTitleCase<T extends string | undefined | null>(str: T): T {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') as T;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Silakan coba lagi setelah 5 menit." }, { status: 429 });
    }

    const body = await request.json();
    const {
      gender, tanggalLahir,
      noWaOrtu, noWaSantri,
      programId
    } = body;

    const nama = toTitleCase(body.nama);
    const tempatLahir = toTitleCase(body.tempatLahir);
    const namaOrtu = toTitleCase(body.namaOrtu);
    const provinsi = toTitleCase(body.provinsi);
    const kabupaten = toTitleCase(body.kabupaten);
    const kecamatan = toTitleCase(body.kecamatan);
    const desa = toTitleCase(body.desa);
    const detailAlamat = toTitleCase(body.detailAlamat);

    // 1. Validasi Program
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    // 2. Tentukan Dufah Tujuan berdasarkan waktu saat ini
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

    const dufahTujuanId = targetDufah.id;

    // 3. Hitung Kode Unik & Total
    const kodeUnik = Math.floor(Math.random() * 900) + 100; // 100-999
    const totalTagihan = program.harga + kodeUnik;

    // 4. Proses Simpan Transaksi (Prisma Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Cek berdasarkan Nama & Tanggal Lahir (karena NIK dihapus)
      const parsedTanggalLahir = new Date(tanggalLahir);
      let santri = await tx.santri.findFirst({ 
        where: { 
          nama, 
          tanggalLahir: parsedTanggalLahir 
        } 
      });
      
      if (!santri) {
        // Buat Santri Baru
        santri = await tx.santri.create({
          data: {
            nama, gender, tempatLahir,
            tanggalLahir: parsedTanggalLahir,
            namaOrtu, noWaOrtu, noWaSantri,
            provinsi, kabupaten, kecamatan, desa, detailAlamat,
            kategori: "BARU", // Pendaftar umum defaultnya BARU
            batasAktifDufah: 0 // Belum aktif secara asrama sampai dibayar
          }
        });
      } else {
        // Update data santri lama jika daftar ulang
        santri = await tx.santri.update({
          where: { id: santri.id },
          data: {
            noWaOrtu, noWaSantri, provinsi, kabupaten, kecamatan, desa, detailAlamat
          }
        });
      }

      // Buat Transaksi
      const noKwitansi = generateInvoiceNumber(dufahTujuanId);
      const transaksi = await tx.transaksiPendaftaran.create({
        data: {
          noKwitansi,
          santriId: santri.id,
          programId: program.id,
          dufahTujuanId,
          nominalProgram: program.harga,
          kodeUnik,
          totalTagihan,
          statusPembayaran: "PENDING"
        }
      });

      return { santri, transaksi, program, noKwitansi };
    });

    emitDataUpdate("pendaftaran-baru");

    // Kirim notifikasi global ke Admin Keuangan
    await sendGlobalNotification(
      "Pendaftaran Baru 📝",
      `Santri a.n ${result.santri.nama} telah mendaftar. Menunggu pembayaran sebesar Rp ${new Intl.NumberFormat('id-ID').format(result.transaksi.totalTagihan)}.`,
      "view_keuangan", // Notifikasi ini dikirim ke siapa saja yang punya akses view_keuangan
      "/admin/pendaftaran"
    );

    await logActivity({
      aksi: "CREATE",
      modul: "Pendaftaran",
      deskripsi: `Pendaftaran baru a.n ${result.santri.nama} — Program: ${result.program.nama} — Total: Rp ${new Intl.NumberFormat('id-ID').format(result.transaksi.totalTagihan)}`,
      namaUser: "Sistem (Form Publik)",
      targetId: result.santri.id,
    });

    return NextResponse.json({
      message: "Pendaftaran berhasil, silakan lakukan pembayaran.",
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error Pendaftaran Publik:", error);
    return NextResponse.json({ error: "Gagal memproses pendaftaran", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Ambil daftar transaksi pending untuk Admin
    const transaksi = await prisma.transaksiPendaftaran.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        santri: true,
        program: true,
        admin: { select: { nama: true } }
      }
    });

    const allDufah = await prisma.dufah.findMany({
      orderBy: { id: 'asc' }
    });

    return NextResponse.json({
      transaksi,
      allDufah
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data transaksi" }, { status: 500 });
  }
}
