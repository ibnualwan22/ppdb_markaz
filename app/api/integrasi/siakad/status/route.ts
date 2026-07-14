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
        isCuti: true,
        batasAktifDufah: true,
        expiredDufahId: true,
        noWaOrtu: true,
        program: {
          select: { id: true, nama: true, kategoriProgram: true }
        },
        transaksi: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            program: {
              select: { nama: true, kategoriProgram: true }
            }
          }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: `Santri dengan NIS ${nis} tidak ditemukan.` }, { status: 404 });
    }

    // Ambil nama Dufah tempat dia expired (dari batasAktifDufah)
    let namaExpiredDufah = null;
    if (santri.batasAktifDufah) {
       const dufahExpired = allDufahs.find(df => df.id === santri.batasAktifDufah);
       if (dufahExpired) {
           namaExpiredDufah = dufahExpired.nama;
       } else {
           // Jika Dufah masa depan belum dibuat di database, tebak namanya otomatis
           namaExpiredDufah = `Duf'ah ${santri.batasAktifDufah}`; 
       }
    }

    // HITUNG KUOTA SEBENARNYA:
    // Jika santri cuti, saldoDufah-nya di-freeze. Jika tidak, hitung (Batas Dufah - Dufah Target + 1)
    let sisaKuota = santri.isCuti ? santri.saldoDufah : 0;
    if (!santri.isCuti && santri.batasAktifDufah && santri.batasAktifDufah >= targetDufahDaftar.id) {
       sisaKuota = santri.batasAktifDufah - targetDufahDaftar.id + 1;
    }

    // LOGIKA OTOMATIS: Menentukan apakah santri ini wajib daftar ulang atau masih punya kuota
    // Santri wajib daftar ulang (Bayar penuh) jika kuota 0 atau batasAktifDufah kurang dari target.
    const butuhDaftarUlang = sisaKuota <= 0;
    
    // Pengecekan Terputus (Penalty Logic)
    let statusKoneksi = "LANCAR";
    // Jika batas aktifnya ada, dan jarak dari batas aktif ke periode target pendaftaran lebih dari 1 periode, dan kuotanya sudah habis
    if (santri.batasAktifDufah && (targetDufahDaftar.id - santri.batasAktifDufah > 1) && sisaKuota <= 0) {
        statusKoneksi = "TERPUTUS"; // Jika jeda > 1 periode
    }

    let formattedWaWali = santri.noWaOrtu;
    if (formattedWaWali) {
      formattedWaWali = formattedWaWali.replace(/\D/g, ""); // hilangkan karakter non-angka
      if (formattedWaWali.startsWith("0")) {
        formattedWaWali = "62" + formattedWaWali.substring(1);
      } else if (formattedWaWali.startsWith("8")) {
        formattedWaWali = "628" + formattedWaWali.substring(1);
      }
    }

    return NextResponse.json({
      message: "Data status santri berhasil diambil.",
      data: {
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        isAktif: santri.isAktif,
        kategoriSiswa: santri.kategori,
        noWaWali: formattedWaWali, // Nomor WA Wali Santri dengan format internasional
        programAktif: santri.program ? santri.program.nama : (santri.transaksi && santri.transaksi.length > 0 ? santri.transaksi[0].program.nama : null),
        kategoriProgram: santri.program ? santri.program.kategoriProgram : (santri.transaksi && santri.transaksi.length > 0 ? santri.transaksi[0].program.kategoriProgram : null),
        masaAktif: {
           sisaKoutaBulan: sisaKuota, 
           berakhirPadaDufahId: santri.batasAktifDufah,
           berakhirPadaDufahNama: namaExpiredDufah || "Belum Ditentukan",
           dufahSekarangSistem: { id: currentActiveDufah?.id, nama: currentActiveDufah?.nama } 
        },
        logikaSistem: {
           butuhDaftarUlang,
           statusKoneksi,
           pesan: butuhDaftarUlang ? "Batas durasi telah/akan habis. Silakan mendaftar ulang untuk periode ini." : "Masa aktif masih berlaku, Anda hanya butuh klaim kelas gratis untuk periode ini."
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
