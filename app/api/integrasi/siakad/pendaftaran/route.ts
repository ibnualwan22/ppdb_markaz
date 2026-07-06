import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/checkPermission";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";

function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000); 
  return `INV-${dufahId}-${dateString}-${randomStr}`;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Cek Permission via Environment Variable (SIAKAD_API_KEY)
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SIAKAD_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 403 });
    }

    const body = await req.json();
    const { nis, programId } = body;

    if (!nis || !programId) {
      return NextResponse.json({ error: "Data 'nis' dan 'programId' wajib dikirim." }, { status: 400 });
    }

    // 2. Cari Data Santri berdasarkan NIS
    const santri = await prisma.santri.findUnique({
      where: { nis }
    });

    if (!santri) {
      return NextResponse.json({ error: `Santri dengan NIS ${nis} tidak ditemukan.` }, { status: 404 });
    }

    // 3. Validasi Program
    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan." }, { status: 404 });
    }

    // 4. Cari Duf'ah yang Sedang Buka
    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'desc' } });
    const now = new Date();
    
    // Prioritaskan yang sedang buka
    let targetDufah = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    // Jika tidak ada yang buka, fallback ke Dufah yang aktif saat ini, 
    // jika masih tidak ada fallback ke id terbesar.
    if (!targetDufah) {
        targetDufah = await prisma.dufah.findFirst({ where: { isActive: true } }) || undefined;
        if(!targetDufah) targetDufah = allDufahs[0];
    }

    if (!targetDufah) {
      return NextResponse.json({ error: "Tidak ada periode Duf'ah yang valid di sistem saat ini." }, { status: 400 });
    }

    // 5. Cek apakah santri masih memiliki sisa paket (Klaim)
    const isKlaimPaket = santri.batasAktifDufah !== null && santri.batasAktifDufah >= targetDufah.id;

    // Jika klaim paket, tagihan otomatis 0. Jika tidak, asumsikan potong 100k karena pendaftar lama tidak perlu atribut.
    const nominalProgram = isKlaimPaket ? 0 : Math.max(0, program.harga - 100000);
    const kodeUnik = isKlaimPaket ? 0 : Math.floor(Math.random() * 900) + 100; // 100-999
    const totalTagihan = nominalProgram + kodeUnik;
    const noKwitansi = generateInvoiceNumber(targetDufah.id);
    const statusPembayaran = isKlaimPaket ? "KLAIM_PAKET" : "PENDING";
    const waktuLunas = isKlaimPaket ? new Date() : null;

    // 6. Simpan Transaksi menggunakan Prisma Transaction
    const transaksi = await prisma.$transaction(async (tx) => {
      const trx = await tx.transaksiPendaftaran.create({
        data: {
          noKwitansi,
          santriId: santri.id,
          programId: program.id,
          dufahTujuanId: targetDufah.id, // TS-error guard: targetDufah is definitely populated here
          nominalProgram,
          kodeUnik,
          totalTagihan,
          statusPembayaran,
          waktuLunas
        }
      });

      // Jika Klaim Paket, lunas otomatis -> buatkan riwayat dufah
      if (isKlaimPaket) {
        const existingRiwayat = await tx.riwayatDufah.findUnique({
          where: { santriId_dufahId: { santriId: santri.id, dufahId: targetDufah.id as number } }
        });
        
        if (!existingRiwayat) {
          // Cari bulanKe sebelumnya
          const dufahLama = await tx.dufah.findFirst({
            where: { id: { lt: targetDufah.id as number } },
            orderBy: { id: 'desc' }
          });

          let riwayatBulanLalu = null;
          if (dufahLama) {
            riwayatBulanLalu = await tx.riwayatDufah.findUnique({
              where: { santriId_dufahId: { santriId: santri.id, dufahId: dufahLama.id } }
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
              bulanKeBaru = durasiBerjalan + 1;
            }
          }

          await tx.riwayatDufah.create({
            data: {
              santriId: santri.id,
              dufahId: targetDufah.id as number,
              lemariId: lemariBaru,
              status: statusBaru,
              isIdCardTaken: false,
              bulanKe: bulanKeBaru,
              isLunas: true
            }
          });
        }
      }

      return trx;
    });

    // 7. Push Notifications & Webhooks
    emitDataUpdate("pendaftaran-baru");

    await sendGlobalNotification(
      "Pendaftaran Ulang dari SIAKAD 🎯",
      `Santri a.n ${santri.nama} (NIS: ${santri.nis}) melakukan pendaftaran via SIAKAD. Menunggu pembayaran sebesar Rp ${new Intl.NumberFormat('id-ID').format(transaksi.totalTagihan)}.`,
      "view_keuangan", 
      "/admin/pendaftaran"
    );

    await logActivity({
      aksi: "CREATE",
      modul: "Integrasi API",
      deskripsi: `Pendaftaran via Endpoint SIAKAD a.n ${santri.nama} — Program: ${program.nama}`,
      namaUser: `Sistem SIAKAD`,
      targetId: santri.id,
    });

    try {
        notifySiakadWebhook(); 
    } catch(e) {
        // Abaikan error webhook saat di sisi server agar transaksi tetap berlanjut
    }

    return NextResponse.json({
      message: "Transaksi pendaftaran berhasil dibuat, menunggu pembayaran.",
      data: {
        transaksi,
        santri: { id: santri.id, nama: santri.nama, nis: santri.nis },
        program: { id: program.id, nama: program.nama }
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error Integrasi SIAKAD API:", error);
    return NextResponse.json({ error: "Gagal memproses pendaftaran", details: error.message }, { status: 500 });
  }
}
