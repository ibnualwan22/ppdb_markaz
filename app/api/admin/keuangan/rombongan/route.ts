import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";

function generateInvoiceNumber(dufahId: number) {
  const date = new Date();
  const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `INV-ROM-${dufahId}-${dateString}-${randomStr}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { namaRombongan, isMouSigned, programId, santris } = body;

    if (!namaRombongan || !programId || !santris || santris.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const program = await prisma.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    }

    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'desc' } });
    const now = new Date();
    const targetDufah = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    if (!targetDufah) {
      return NextResponse.json({ error: "Tidak ada Duf'ah yang sedang buka" }, { status: 400 });
    }

    const dufahTujuanId = targetDufah.id;

    const diskonPersen = isMouSigned ? 10 : 0;
    const hargaUnit = program.harga;
    const diskonUnit = isMouSigned ? (hargaUnit * 0.1) : 0;
    const hargaSetelahDiskon = hargaUnit - diskonUnit;
    const totalTagihan = hargaSetelahDiskon * santris.length;

    const result = await prisma.$transaction(async (tx) => {
      // Create Rombongan
      const rombongan = await tx.rombongan.create({
        data: {
          nama: namaRombongan,
          isMouSigned,
          diskonPersen,
          totalTagihan,
          dufahTujuanId,
          statusPembayaran: "PENDING",
        }
      });

      // Process Santris
      for (const s of santris) {
        const parsedTanggalLahir = s.tanggalLahir ? new Date(s.tanggalLahir) : null;
        let santri = null;

        // 1. Coba cari berdasarkan NIS jika diberikan
        if (s.nis) {
          santri = await tx.santri.findFirst({
            where: { nis: s.nis.toString() }
          });
        }

        // 2. Jika tidak ketemu by NIS, cari berdasarkan Nama & Tanggal Lahir
        if (!santri) {
          santri = await tx.santri.findFirst({
            where: {
              nama: s.nama,
              tanggalLahir: parsedTanggalLahir
            }
          });
        }

        if (!santri) {
          // Buat Santri Baru
          santri = await tx.santri.create({
            data: {
              nis: s.nis ? s.nis.toString() : null,
              nama: s.nama,
              gender: s.gender || "BANIN",
              tempatLahir: s.tempatLahir,
              tanggalLahir: parsedTanggalLahir,
              namaOrtu: s.namaOrtu,
              noWaOrtu: s.noWaOrtu ? s.noWaOrtu.toString() : null,
              noWaSantri: s.noWaSantri ? s.noWaSantri.toString() : null,
              provinsi: s.provinsi,
              kabupaten: s.kabupaten,
              kecamatan: s.kecamatan,
              desa: s.desa,
              detailAlamat: s.detailAlamat,
              kategori: "BARU",
              batasAktifDufah: 0
            }
          });
        } else {
          // Santri sudah ada, perbarui kategori ke LAMA jika sebelumnya BARU
          if (santri.kategori !== "LAMA") {
            santri = await tx.santri.update({
              where: { id: santri.id },
              data: { kategori: "LAMA" }
            });
          }
        }

        const noKwitansi = generateInvoiceNumber(dufahTujuanId);
        await tx.transaksiPendaftaran.create({
          data: {
            noKwitansi,
            santriId: santri.id,
            programId: program.id,
            dufahTujuanId,
            nominalProgram: program.harga,
            kodeUnik: 0,
            totalTagihan: hargaSetelahDiskon,
            statusPembayaran: "PENDING",
            rombonganId: rombongan.id
          }
        });
      }

      return rombongan;
    });

    emitDataUpdate("pendaftaran-baru");

    return NextResponse.json({
      message: "Data rombongan berhasil diimport",
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error Import Rombongan:", error);
    return NextResponse.json({ error: "Gagal import rombongan", details: error.message }, { status: 500 });
  }
}
