import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Fungsi bantuan untuk menghasilkan NIS: Duf'ah + DDMMYY + Urut
async function generateNIS(tx: any, dufah: any, tanggalLahir: Date) {
  const dufahNumberMatch = dufah.nama.match(/\d+/);
  const rawPrefix = dufahNumberMatch ? dufahNumberMatch[0] : dufah.id.toString();
  const dufahPrefix = rawPrefix.padStart(2, '0');
  
  const dd = tanggalLahir.getDate().toString().padStart(2, '0');
  const mm = (tanggalLahir.getMonth() + 1).toString().padStart(2, '0');
  const yy = tanggalLahir.getFullYear().toString().slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tanggalLahir, tambahanDurasi } = await request.json();

    if (!tanggalLahir || tambahanDurasi === undefined) {
      return NextResponse.json({ error: "Tanggal lahir dan sisa durasi wajib diisi" }, { status: 400 });
    }

    const tglLahirDate = new Date(tanggalLahir);

    // Dapatkan Santri
    const santri = await prisma.santri.findUnique({
      where: { id },
      include: {
        riwayat: {
          orderBy: { dufahId: 'asc' },
          take: 1
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    }

    // Dapatkan Duf'ah Aktif Saat Ini
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json({ error: "Tidak ada Duf'ah aktif di sistem" }, { status: 400 });
    }

    // Eksekusi Transaction
    const updatedSantri = await prisma.$transaction(async (tx) => {
      // 1. Tentukan batasAktifDufah
      let newBatasAktif = dufahAktif.id + Number(tambahanDurasi);
      
      // Khusus jika status dia KSU, kita beri batas lebih panjang
      if (santri.kategori === "KSU") {
        newBatasAktif = dufahAktif.id + 12;
      }

      // 2. Generate NIS
      let nis = santri.nis;
      if (!nis) {
        // Tentukan Duf'ah pendaftaran (Duf'ah paling awal di riwayatnya)
        const firstRiwayat = santri.riwayat[0];
        let dufahTarget = dufahAktif; // Default
        
        if (firstRiwayat) {
          const dufahAwal = await tx.dufah.findUnique({ where: { id: firstRiwayat.dufahId } });
          if (dufahAwal) dufahTarget = dufahAwal;
        }

        nis = await generateNIS(tx, dufahTarget, tglLahirDate);
      }

      // 3. Update Santri
      return await tx.santri.update({
        where: { id },
        data: {
          nis,
          tanggalLahir: tglLahirDate,
          batasAktifDufah: newBatasAktif,
          isAktif: true // Pastikan statusnya aktif (reset jika terlanjur "0 Bulan")
        }
      });
    });

    return NextResponse.json({
      message: "Data santri berhasil dilengkapi dan NIS ter-generate.",
      data: updatedSantri
    });
  } catch (error: any) {
    console.error("Lengkapi Data Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem", details: error.message }, { status: 500 });
  }
}
