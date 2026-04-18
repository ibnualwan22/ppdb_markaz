import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import https from "https";

const prisma = new PrismaClient();

// Fungsi bantuan untuk menghasilkan NIS: Duf'ah + DDMMYY + Urut
async function generateNIS(tx: any, dufah: any, tanggalLahir: Date) {
  const dufahNumberMatch = dufah.nama.match(/\d+/);
  const rawPrefix = dufahNumberMatch ? dufahNumberMatch[0] : dufah.id.toString();
  // Pad dengan '0' jika kurang dari 2 digit (misal '9' jadi '09'). 
  // Jika 3 digit ('100'), maka padStart tidak akan memotong nilainya, tetap '100'.
  const dufahPrefix = rawPrefix.padStart(2, '0');
  
  const dd = tanggalLahir.getDate().toString().padStart(2, '0');
  const mm = (tanggalLahir.getMonth() + 1).toString().padStart(2, '0');
  const yy = tanggalLahir.getFullYear().toString().slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  
  // Cari semua NIS di dufah ini untuk mendapatkan nomor urut tertinggi
  const santris = await tx.santri.findMany({
    where: { nis: { startsWith: dufahPrefix } },
    select: { nis: true }
  });

  let maxUrut = 0;
  for (const s of santris) {
    if (s.nis && s.nis.length >= 3) {
      const urutStr = s.nis.slice(-3);
      const urutVal = parseInt(urutStr, 10);
      if (!isNaN(urutVal) && urutVal > maxUrut) {
        maxUrut = urutVal;
      }
    }
  }

  const urut = maxUrut + 1;
  
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
        nis = await generateNIS(tx, dufahAktif, new Date(transaksi.santri.tanggalLahir));
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
    if (process.env.FONNTE_API_KEY) {
      const targets = [];
      if (transaksi.santri.noWaOrtu) targets.push(transaksi.santri.noWaOrtu);
      if (transaksi.santri.noWaSantri) targets.push(transaksi.santri.noWaSantri);

      if (targets.length > 0) {
        const targetString = targets.join(",");
        const pesan = `*ADMINISTRASI LUNAS* ✅\n\nAssalamu'alaikum,\nAlhamdulillah, pembayaran pendaftaran telah kami verifikasi *LUNAS*.\n\nBerikut detail data santri:\nNama: *${transaksi.santri.nama}*\nNIS: *${result.nis || "-"}*\nProgram: *${transaksi.program.nama}*\nDurasi: *${transaksi.program.durasiBulan} Bulan*\n\nSaat ini santri telah resmi terdaftar dan masuk ke dalam antrean Asrama/Duf'ah.\n\nJazakumullah khairan.\n_Admin Markaz Arabiyah_`;

        try {
          const bodyParams = new URLSearchParams();
          bodyParams.append("target", targetString);
          bodyParams.append("message", pesan);
          bodyParams.append("countryCode", "62");
          
          const postData = bodyParams.toString();
          
          const req = https.request({
            hostname: 'api.fonnte.com',
            port: 443,
            path: '/send',
            method: 'POST',
            headers: {
              'Authorization': process.env.FONNTE_API_KEY || "",
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              console.log("Response Fonnte HTTP:", data);
            });
          });

          req.on('error', (e) => {
            console.error("Fonnte HTTP Error:", e);
          });

          req.write(postData);
          req.end();

        } catch (err) {
          console.error("Fonnte try-catch Error:", err);
        }
      }
    }

    return NextResponse.json({
      message: "Verifikasi berhasil. Santri telah masuk antrean asrama.",
      data: result
    });

  } catch (error: any) {
    console.error("Error Verifikasi:", error);
    return NextResponse.json({ error: "Gagal memverifikasi", details: error.message }, { status: 500 });
  }
}
