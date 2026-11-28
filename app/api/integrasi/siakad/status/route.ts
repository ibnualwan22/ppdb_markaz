import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  isAkbarnasProgramName,
  isAkbarnasBulan2OnlyProgram,
  computeDaftarUlangPricing,
} from "@/lib/akbarnas-daftar-ulang";

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

    const targetAkbarnasBulan = targetDufahDaftar?.akbarnasBulan ?? 1;
    const formatterId = new Intl.NumberFormat('id-ID');

    const buildProgramTersedia = (sisaKuota: number, santriIsAkbarnasBulan1: boolean) => {
      return programs
        .filter((p) => {
          if (isAkbarnasBulan2OnlyProgram(p.nama)) return false;
          // Saat Duf'ah tujuan = Bulan 2, program Akbarnas HANYA muncul bagi santri Akbarnas Bulan 1
          if (targetAkbarnasBulan === 2 && isAkbarnasProgramName(p.nama)) {
            return santriIsAkbarnasBulan1;
          }
          return true;
        })
        .map(p => {
          const tgMulai = p.tanggalMulaiDefault || "10";
          const tgTutup = p.tanggalTutupDefault || "06";

          let displayMulai = tgMulai;
          let displayTutup = tgTutup;

          if (targetDufahDaftar && targetDufahDaftar.tanggalBuka) {
            if (/^\d+$/.test(tgMulai.trim())) {
              const d = new Date(targetDufahDaftar.tanggalBuka);
              d.setMonth(d.getMonth() + 1);
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

          const pricing = computeDaftarUlangPricing({
            program: p,
            sisaKuota,
            isBeliAtribut: false,
            targetAkbarnasBulan,
            santriIsAkbarnasBulan1,
          });

          return {
            id: p.id,
            nama: p.nama,
            harga: p.harga,
            hargaFormatted: `Rp ${formatterId.format(p.harga)}`,
            durasiBulan: p.durasiBulan,
            requiredBulan: pricing.requiredBulan,
            durasiBulanFormatted: `${pricing.requiredBulan} BULAN`,
            kategoriProgram: p.kategoriProgram,
            tglProgramFormatted: `${displayMulai} - ${displayTutup}`,
            mode: pricing.mode,
            bisaKlaimGratis: pricing.bisaKlaimGratis,
            kekuranganBulan: pricing.kekuranganBulan,
            tarifPerBulan: pricing.tarifPerBulan,
            nominalTanpaAtribut: pricing.nominalTanpaAtribut,
            nominalDenganAtribut: pricing.nominalDenganAtribut,
          };
        });
    };

    if (!nis) {
      return NextResponse.json({
        message: "Informasi portal pendaftaran berhasil diambil.",
        data: null,
        meta: {
           informasiPendaftaranBuka: targetDufahDaftar,
           programTersedia: buildProgramTersedia(0, false)
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
          select: { id: true, nama: true, kategoriProgram: true, siakadProgramNama: true }
        },
        riwayat: currentActiveDufah
          ? {
              where: { dufahId: currentActiveDufah.id },
              take: 1,
              select: {
                program: {
                  select: { id: true, nama: true, kategoriProgram: true, siakadProgramNama: true },
                },
              },
            }
          : false,
        transaksi: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            program: {
              select: { nama: true, kategoriProgram: true, siakadProgramNama: true }
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

    // SISA UNTUK TAMPILAN: dihitung terhadap dufah yang sedang berjalan (bukan target pendaftaran),
    // agar kartu "Masa Aktif Asrama" tidak menampilkan 0 padahal santri masih di dalam masa aktifnya.
    // Logika daftar-ulang (butuhDaftarUlang) tetap memakai sisaKuota berbasis target pendaftaran.
    let sisaBerjalan = santri.isCuti ? santri.saldoDufah : 0;
    if (!santri.isCuti && santri.batasAktifDufah && currentActiveDufah && santri.batasAktifDufah >= currentActiveDufah.id) {
       sisaBerjalan = santri.batasAktifDufah - currentActiveDufah.id + 1;
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

    // Prioritaskan program dari RiwayatDufah Duf'ah berjalan -> fallback Santri.program -> transaksi terakhir
    const activeRiwayatProgram = Array.isArray((santri as any).riwayat)
      ? (santri as any).riwayat[0]?.program ?? null
      : null;
    const resolvedProgramObj =
      activeRiwayatProgram ||
      santri.program ||
      (santri.transaksi && santri.transaksi.length > 0 ? santri.transaksi[0].program : null);

    const programAktifNama = resolvedProgramObj?.nama ?? null;
    const siakadProgramNama = resolvedProgramObj?.siakadProgramNama ?? null;
    const resolvedKategoriProgram = resolvedProgramObj?.kategoriProgram ?? null;

    const santriIsAkbarnasBulan1 =
      isAkbarnasProgramName(programAktifNama) &&
      (currentActiveDufah?.akbarnasBulan === 1 || (targetAkbarnasBulan === 2 && sisaKuota > 0));

    const programTersedia = buildProgramTersedia(sisaKuota, santriIsAkbarnasBulan1);

    return NextResponse.json({
      message: "Data status santri berhasil diambil.",
      data: {
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        isAktif: santri.isAktif,
        kategoriSiswa: santri.kategori,
        noWaWali: formattedWaWali, // Nomor WA Wali Santri dengan format internasional
        programAktif: programAktifNama,
        siakadProgramNama,
        kategoriProgram: resolvedKategoriProgram,
        santriIsAkbarnasBulan1,
        masaAktif: {
           sisaKoutaBulan: sisaKuota,
           sisaBulanBerjalan: sisaBerjalan,
           berakhirPadaDufahId: santri.batasAktifDufah,
           berakhirPadaDufahNama: namaExpiredDufah || "Belum Ditentukan",
           dufahSekarangSistem: { id: currentActiveDufah?.id, nama: currentActiveDufah?.nama, akbarnasBulan: currentActiveDufah?.akbarnasBulan ?? 1 } 
        },
        logikaSistem: {
           butuhDaftarUlang,
           // true bila santri punya kuota aktif mencakup dufah target -> halaman Siakad tampil mode "Pemilihan Program"
           klaimTersedia: !butuhDaftarUlang,
           statusKoneksi,
           pesan: butuhDaftarUlang ? "Batas durasi telah/akan habis. Silakan mendaftar ulang untuk periode ini." : `Masa aktif masih tersisa ${sisaKuota} bulan. Program ≤ ${sisaKuota} bulan gratis diklaim; program berdurasi lebih panjang akan dihitung kekurangannya.`
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
