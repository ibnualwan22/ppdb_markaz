import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    
    let stats = {
      dufahNama: dufahAktif ? dufahAktif.nama : "Tidak ada Duf'ah Aktif",
      totalMasukSakan: 0,
      totalAmbilIdCard: 0,
      selisih: 0,
      listBelumIdCard: [] as any[],
      sakanBanin: [] as { nama: string, total: number }[],
      sakanBanat: [] as { nama: string, total: number }[],
      totalBanin: 0,
      totalBanat: 0,
      idCardBaru: 0,
      idCardLama: 0,
      totalKSU: 0, // <-- STATE BARU UNTUK KSU
    };

    if (dufahAktif) {
      const sakanData = await prisma.sakan.findMany({
        include: {
          kamar: {
            include: { lemari: { include: { penghuni: { where: { dufahId: dufahAktif.id, status: { not: "CHECKED_OUT" } } } } } }
          }
        },
        orderBy: { nama: 'asc' }
      });

      sakanData.forEach(sakan => {
        let count = 0;
        sakan.kamar.forEach(kamar => {
          kamar.lemari.forEach(lemari => {
            if (lemari.penghuni && lemari.penghuni.length > 0) count++;
          });
        });

        if (sakan.kategori === 'BANAT') {
          stats.sakanBanat.push({ nama: sakan.nama, total: count });
          stats.totalBanat += count;
        } else {
          stats.sakanBanin.push({ nama: sakan.nama, total: count });
          stats.totalBanin += count;
        }
      });

      stats.totalMasukSakan = stats.totalBanin + stats.totalBanat;

      // 1. Hitung MURNI Santri Baru di Meja ID Card
      stats.idCardBaru = await prisma.riwayatDufah.count({
        where: { dufahId: dufahAktif.id, lemariId: { not: null }, isIdCardTaken: true, status: { not: "CHECKED_OUT" }, santri: { kategori: 'BARU' } }
      });

      // 2. Hitung MURNI Santri Lama di Meja ID Card (KSU DIKELUARKAN!)
      stats.idCardLama = await prisma.riwayatDufah.count({
        where: { dufahId: dufahAktif.id, lemariId: { not: null }, isIdCardTaken: true, status: { not: "CHECKED_OUT" }, santri: { kategori: 'LAMA' } }
      });

      // 3. Hitung Total KSU yang menempati Sakan
      stats.totalKSU = await prisma.riwayatDufah.count({
        where: { dufahId: dufahAktif.id, lemariId: { not: null }, status: { not: "CHECKED_OUT" }, santri: { kategori: 'KSU' } }
      });

      stats.totalAmbilIdCard = stats.idCardBaru + stats.idCardLama;
      
      // 4. Selisih Murni = Total Keseluruhan - (Yang sudah ID Card + Pengurus KSU)
      stats.selisih = stats.totalMasukSakan - stats.totalAmbilIdCard - stats.totalKSU;

      // 5. Daftar Selisih (Pastikan KSU tidak masuk ke sini)
      stats.listBelumIdCard = await prisma.riwayatDufah.findMany({
        where: { 
          dufahId: dufahAktif.id, 
          lemariId: { not: null }, 
          isIdCardTaken: false,
          status: { not: "CHECKED_OUT" }
        },
        include: {
          santri: { select: { nama: true, kategori: true, gender: true } },
          lemari: { include: { kamar: { include: { sakan: true } } } }
        },
        orderBy: { lemari: { kamar: { sakan: { nama: 'asc' } } } } 
      });
    }

    const historiDufahRaw = await prisma.dufah.findMany({
      select: { 
        id: true, 
        nama: true, 
        tanggalBuka: true, 
        riwayat: { select: { santriId: true, isLunas: true, santri: { select: { gender: true } } } }
      },
      orderBy: { id: 'asc' }
    });

    // Ambil data batas aktif santri untuk mengakomodasi input manual (yang belum dibuatkan riwayat)
    const allSantriAktif = await prisma.santri.findMany({
      where: { isAktif: true },
      select: { id: true, gender: true, batasAktifDufah: true, riwayat: { select: { dufahId: true } } }
    });

    const grafikData = historiDufahRaw.map(d => {
      let totalBanin = 0; let totalBanat = 0;
      
      // 1. Hitung dari RiwayatDufah yang eksplisit (Pendaftaran Lunas / Rollover)
      d.riwayat.forEach(r => {
        if (r.isLunas) {
          if (r.santri.gender === 'BANAT') totalBanat++;
          else totalBanin++;
        }
      });

      // 2. Tambahkan Santri yang diperpanjang manual (batasAktif >= d.id) 
      // tetapi BELUM punya RiwayatDufah eksplisit di dufah d ini.
      allSantriAktif.forEach(s => {
        if (s.batasAktifDufah >= d.id) {
          const punyaRiwayatEksplisit = s.riwayat.some(r => r.dufahId === d.id);
          const punyaRiwayatLama = s.riwayat.some(r => r.dufahId < d.id);
          
          if (!punyaRiwayatEksplisit && punyaRiwayatLama) {
            if (s.gender === 'BANAT') totalBanat++;
            else totalBanin++;
          }
        }
      });

      return {
        id: d.id, nama: d.nama,
        tahun: d.tanggalBuka ? new Date(d.tanggalBuka).getFullYear() : new Date().getFullYear(),
        totalPendaftar: totalBanin + totalBanat, totalBanin, totalBanat
      };
    });

    return NextResponse.json({ stats, grafikData });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data dashboard" }, { status: 500 });
  }
}