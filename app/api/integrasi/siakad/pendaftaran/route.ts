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
    // 1. Cek Permission via API Key (Headers x-api-key)
    const auth = await checkPermission(req, "integrasi_siakad");
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.reason || "Forbidden" }, { status: 403 });
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

    // 5. Hitung Kode Unik & Total Tagihan
    const kodeUnik = Math.floor(Math.random() * 900) + 100; // 100-999
    const totalTagihan = program.harga + kodeUnik;
    const noKwitansi = generateInvoiceNumber(targetDufah.id);

    // 6. Simpan Transaksi
    const transaksi = await prisma.transaksiPendaftaran.create({
      data: {
        noKwitansi,
        santriId: santri.id,
        programId: program.id,
        dufahTujuanId: targetDufah.id,
        nominalProgram: program.harga,
        kodeUnik,
        totalTagihan,
        statusPembayaran: "PENDING"
      }
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
      namaUser: `Sistem SIAKAD ${auth.project ? `(${auth.project})` : ""}`,
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
