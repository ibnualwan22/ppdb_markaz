import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import https from "https";
import { sendGlobalNotification, emitDataUpdate, logActivity } from "@/app/lib/pusherServer";

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

    // Pastikan admin masih ada di database (mencegah error session usang jika database direset)
    const adminExists = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminExists) {
      return NextResponse.json({ error: "Sesi tidak valid (User Admin tidak ditemukan). Silakan logout lalu login kembali." }, { status: 401 });
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

      // 2. Tentukan Dufah Target (Bisa hari ini atau masa depan)
      const targetDufahId = transaksi.dufahTujuanId || dufahAktif.id;
      const targetDufahObj = await tx.dufah.findUnique({ where: { id: targetDufahId } }) || dufahAktif;

      // 3. Generate NIS jika belum punya
      let nis = transaksi.santri.nis;
      if (!nis && transaksi.santri.tanggalLahir) {
        // Gunakan targetDufahObj (Duf'ah Tujuan) untuk NIS, bukan dufahAktif saat ini
        nis = await generateNIS(tx, targetDufahObj, new Date(transaksi.santri.tanggalLahir));
      }

      // 4. Kalkulasi Batas Aktif Duf'ah
      const santriDb = await tx.santri.findUnique({ where: { id: transaksi.santriId } });
      const currentBatas = santriDb?.batasAktifDufah || 0;
      
      let newBatasAktif = currentBatas;
      if (isKSU) {
        // KSU diberi batas +12 bulan dari target pendaftarannya
        newBatasAktif = targetDufahId + 12; 
      } else {
        // Jika santri mati (batasAktif < targetDufahId), mulai dari target dufah tersebut.
        // Jika masih aktif, tambahkan ke batas aktif lama.
        const startDufah = currentBatas < targetDufahId ? targetDufahId : currentBatas + 1;
        newBatasAktif = startDufah + transaksi.program.durasiBulan - 1;
      }

      // 5. Update Santri
      const santriUpdate = await tx.santri.update({
        where: { id: transaksi.santriId },
        data: {
          nis,
          batasAktifDufah: newBatasAktif,
          isAktif: true,
          kategori: isKSU ? "KSU" : santriDb?.kategori
        }
      });

      // 6. Buat Riwayat Duf'ah untuk dufah tujuan jika belum ada
      const isBeliAtribut = transaksi.nominalProgram >= transaksi.program.harga;

      const cekRiwayat = await tx.riwayatDufah.findUnique({
        where: {
          santriId_dufahId: { santriId: transaksi.santriId, dufahId: targetDufahId }
        }
      });

      if (!cekRiwayat) {
        // Logika Kontinuitas: Cek riwayat terakhir untuk bulanKe dan Kamar
        const lastRiwayatEver = await tx.riwayatDufah.findFirst({
          where: { santriId: transaksi.santriId },
          orderBy: { dufahId: 'desc' }
        });

        let newBulanKe = 1;
        let previousLemariId = null;

        if (lastRiwayatEver) {
          // Lanjut bulanKe tidak mengulang dari 0 (biarpun ada jeda)
          newBulanKe = (lastRiwayatEver.bulanKe || 1) + 1;

          // Kontinuitas Kamar: Hanya jika bersambung langsung dari Dufah sebelumnya
          const previousDufah = await tx.dufah.findFirst({
            where: { id: { lt: targetDufahId } },
            orderBy: { id: 'desc' }
          });

          if (previousDufah && lastRiwayatEver.dufahId === previousDufah.id) {
            previousLemariId = lastRiwayatEver.lemariId;
          }
        }

        await tx.riwayatDufah.create({
          data: {
            santriId: transaksi.santriId,
            dufahId: targetDufahId,
            lemariId: previousLemariId,
            status: previousLemariId ? "ASSIGNED" : "PRE_LIST", // Langsung ASSIGNED jika kamar lanjut
            bulanKe: newBulanKe,
            // Jika TIDAK beli atribut, berarti sudah punya. Kita set true agar tidak muncul di tagihan Mims Store.
            isDresscodeTaken: !isBeliAtribut,
            isToteBagTaken: !isBeliAtribut,
            isPinTaken: !isBeliAtribut,
            isSongkokKhimarTaken: !isBeliAtribut,
            isMalzamahTaken: !isBeliAtribut,
            isTabirotTaken: !isBeliAtribut
          }
        });
      } else {
        // Jika riwayat sudah ada, dan dia beli atribut, reset statusnya jadi false agar ditagih lagi.
        if (isBeliAtribut) {
           await tx.riwayatDufah.update({
             where: { id: cekRiwayat.id },
             data: {
               isDresscodeTaken: false,
               isToteBagTaken: false,
               isPinTaken: false,
               isSongkokKhimarTaken: false,
               isMalzamahTaken: false,
               isTabirotTaken: false
             }
           });
        }
      }

      return santriUpdate;
    });

    // KIRIM UPDATE DATA KE FRONTEND
    emitDataUpdate("pendaftaran-verified");

    // KIRIM NOTIFIKASI GLOBAL KE ASRAMA & ID CARD
    await sendGlobalNotification(
      "Pembayaran Lunas 💰",
      `Santri a.n ${result.nama} (NIS: ${result.nis || "-"}) telah diverifikasi lunas. Siap untuk plot asrama.`,
      "receive_notif_plot_asrama",
      "/admin/asrama"
    );

    // Ambil nama admin yang memverifikasi
    const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { nama: true, username: true } });
    const pelaku = adminUser ? `${adminUser.nama} (@${adminUser.username})` : "Admin";

    await logActivity({
      aksi: "VERIFY",
      modul: "Keuangan",
      deskripsi: `Memverifikasi pembayaran santri a.n ${result.nama} (NIS: ${result.nis || "-"}) — No. Kwitansi: ${transaksi.noKwitansi}`,
      namaUser: pelaku,
      userId: adminId,
      targetId: transaksi.santriId,
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
