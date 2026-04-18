import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { checkRateLimit } from "@/app/lib/rateLimit";

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
      gender, nik, tanggalLahir,
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

    // 2. Ambil Dufah Aktif
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json({ error: "Belum ada Duf'ah yang aktif untuk pendaftaran" }, { status: 400 });
    }

    // 3. Hitung Kode Unik & Total
    const kodeUnik = Math.floor(Math.random() * 900) + 100; // 100-999
    const totalTagihan = program.harga + kodeUnik;

    // 4. Proses Simpan Transaksi (Prisma Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Cek apakah santri dengan NIK ini sudah ada
      let santri = await tx.santri.findUnique({ where: { nik } });
      
      if (!santri) {
        // Buat Santri Baru
        santri = await tx.santri.create({
          data: {
            nama, gender, nik, tempatLahir,
            tanggalLahir: new Date(tanggalLahir),
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
      const noKwitansi = generateInvoiceNumber(dufahAktif.id);
      const transaksi = await tx.transaksiPendaftaran.create({
        data: {
          noKwitansi,
          santriId: santri.id,
          programId: program.id,
          nominalProgram: program.harga,
          kodeUnik,
          totalTagihan,
          statusPembayaran: "PENDING"
        }
      });

      return { santri, transaksi, program };
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
