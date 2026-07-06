import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/checkPermission";

export async function GET(req: NextRequest) {
  try {
    // 1. Cek Permission via Environment Variable
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.SIAKAD_API_KEY) {
      return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const nis = searchParams.get("nis");

    // 2. Ambil Global Info (Duf'ah & Program) meskipun tanpa NIS
    const allDufahs = await prisma.dufah.findMany({ orderBy: { id: 'desc' } });
    const now = new Date();
    
    let targetDufahDaftar = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    const currentActiveDufah = allDufahs.find(df => df.isActive === true) || allDufahs[0];
    
    // Jika tidak ada yang buka secara tanggal, gunakan dufah yang aktif
    if(!targetDufahDaftar) targetDufahDaftar = currentActiveDufah;

    // Ambil daftar program
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      select: { id: true, nama: true, harga: true, durasiBulan: true, kategoriProgram: true, tanggalMulaiDefault: true, tanggalTutupDefault: true }
    });

    const formatterId = new Intl.NumberFormat('id-ID');
    const programTersedia = programs.map(p => {
      const tgMulai = p.tanggalMulaiDefault || "10";
      const tgTutup = p.tanggalTutupDefault || "06";

      let displayMulai = tgMulai;
      let displayTutup = tgTutup;

      if (targetDufahDaftar && targetDufahDaftar.tanggalBuka) {
        if (/^\d+$/.test(tgMulai.trim())) {
          const d = new Date(targetDufahDaftar.tanggalBuka);
          d.setMonth(d.getMonth() + 1);
          // Menggunakan Intl.DateTimeFormat agar konsisten di semua lingkungan Node
          const formatterBln = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
          displayMulai = `${tgMulai.trim()} ${formatterBln.format(d)}`;
        }
        if (/^\d+$/.test(tgTutup.trim())) {
          const d = new Date(targetDufahDaftar.tanggalBuka);
          d.setMonth(d.getMonth() + 1 + p.durasiBulan);
          const formatterBln = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
          displayTutup = `${tgTutup.trim()} ${formatterBln.format(d)}`;
        }
      }

      return {
        id: p.id,
        nama: p.nama,
        harga: p.harga,
        hargaFormatted: `Rp ${formatterId.format(p.harga)}`,
        durasiBulan: p.durasiBulan,
        durasiBulanFormatted: `${p.durasiBulan} BULAN`,
        kategoriProgram: p.kategoriProgram,
        tglProgramFormatted: `${displayMulai} - ${displayTutup}`
      };
    });

    if (!nis) {
      // Jika dipanggil tanpa NIS, kembalikan hanya info portal umum
      return NextResponse.json({
        message: "Informasi portal pendaftaran berhasil diambil.",
        data: null,
        meta: {
           informasiPendaftaranBuka: targetDufahDaftar,
           programTersedia
        }
      }, { status: 200 });
    }

    // 3. Ambil data santri
    const santri = await prisma.santri.findUnique({
      where: { nis },
      select: {
        id: true,
        nis: true,
        nama: true,
        kategori: true,
        isAktif: true,
        saldoDufah: true,
        batasAktifDufah: true,
        expiredDufahId: true,
        program: {
          select: { id: true, nama: true, kategoriProgram: true }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: `Santri dengan NIS ${nis} tidak ditemukan.` }, { status: 404 });
    }

    // Ambil nama Dufah tempat dia expired
    let namaExpiredDufah = null;
    if (santri.expiredDufahId) {
       const dufahExpired = allDufahs.find(df => df.id === santri.expiredDufahId);
       if (dufahExpired) namaExpiredDufah = dufahExpired.nama;
    }

    // LOGIKA OTOMATIS: Menentukan apakah santri ini wajib daftar ulang atau masih punya kuota
    // Santri wajib daftar ulang jika expiredDufahId-nya lebih kecil (sudah lewat) dari Dufah target pendaftaran (TargetDufahDaftar) 
    // atau saldoDufah-nya 0.
    const butuhDaftarUlang = (santri.saldoDufah <= 0) || (santri.expiredDufahId ? santri.expiredDufahId < targetDufahDaftar.id : true);
    
    // Pengecekan Terputus (Penalty Logic)
    let statusKoneksi = "LANCAR";
    if (santri.expiredDufahId && (targetDufahDaftar.id - santri.expiredDufahId > 1) && santri.saldoDufah <= 0) {
        statusKoneksi = "TERPUTUS"; // Jika jeda antara masa expired dan periode pendaftaran sekarang > 1 periode
    }

    return NextResponse.json({
      message: "Data status santri berhasil diambil.",
      data: {
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        isAktif: santri.isAktif,
        kategoriSiswa: santri.kategori,
        programAktif: santri.program ? santri.program.nama : null,
        kategoriProgram: santri.program ? santri.program.kategoriProgram : null,
        masaAktif: {
           sisaKoutaBulan: santri.saldoDufah, 
           berakhirPadaDufahId: santri.expiredDufahId,
           berakhirPadaDufahNama: namaExpiredDufah || "Belum Ditentukan",
           dufahSekarangSistem: { id: currentActiveDufah?.id, nama: currentActiveDufah?.nama } 
        },
        logikaSistem: {
           butuhDaftarUlang,
           statusKoneksi,   // Jika TERPUTUS, biasanya fasilitas kamar direset dan dianggap pendaftar BARU.
           pesan: butuhDaftarUlang ? "Batas durasi telah/akan habis. Silakan mendaftar ulang untuk periode ini." : "Masa aktif masih berlaku, belum wajib daftar ulang."
        }
      },
      meta: {
         informasiPendaftaranBuka: targetDufahDaftar,
         programTersedia
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error Integrasi SIAKAD Check Status:", error);
    return NextResponse.json({ error: "Gagal mengambil data status", details: error.message }, { status: 500 });
  }
}
