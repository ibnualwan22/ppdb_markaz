import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, emitNotification } from "@/app/lib/pusherServer";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Default ke BULAN_INI jika tidak ada param
    const filterDufahId = searchParams.get("dufahId") || "BULAN_INI";

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

    // Ambil semua dufah untuk dropdown filter di frontend
    const allDufahList = await prisma.dufah.findMany({ orderBy: { id: 'desc' } });

    if (!dufahAktif) return NextResponse.json({
      belum: [], sudah: [], dufahNama: "Tidak ada Duf'ah Aktif", daftarDufah: allDufahList
    });

    let relevantDufahIds: number[] | undefined = undefined;
    let dufahLabel = dufahAktif.nama;

    if (filterDufahId === "ALL") {
      relevantDufahIds = undefined; // Undefined = tanpa filter, ambil semua
      dufahLabel = "Semua Duf'ah";
    } else if (filterDufahId && !isNaN(Number(filterDufahId))) {
      // Filter ke dufah spesifik
      relevantDufahIds = [Number(filterDufahId)];
      const specificDufah = await prisma.dufah.findUnique({ where: { id: Number(filterDufahId) } });
      dufahLabel = specificDufah?.nama || "Duf'ah Tidak Diketahui";
    } else {
      // BULAN_INI: Duf'ah Aktif + Duf'ah Target (yang tanggalBuka/tanggalTutup mencakup bulan ini)
      const now = new Date();
      const dufahTarget = allDufahList.find(df => {
        if (!df.tanggalBuka || !df.tanggalTutup) return false;
        return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
      });

      relevantDufahIds = [dufahAktif.id];
      if (dufahTarget && dufahTarget.id !== dufahAktif.id) {
        relevantDufahIds.push(dufahTarget.id);
      }
      dufahLabel = dufahTarget && dufahTarget.id !== dufahAktif.id
        ? `${dufahAktif.nama} & ${dufahTarget.nama}`
        : dufahAktif.nama;
    }

    const whereDufah = relevantDufahIds ? { in: relevantDufahIds } : undefined;

    // Ambil semua riwayat dalam scope, orderBy id desc agar yang terbaru duluan
    // distinct: ['santriId'] = jika santri memperbarui pendaftaran, hanya tampilkan data terbaru
    const allRiwayat = await prisma.riwayatDufah.findMany({
      where: {
        ...(whereDufah && { dufahId: whereDufah }),
        lemariId: { not: null },
        santri: { kategori: { not: 'KSU' } }
      },
      include: {
        santri: { select: { id: true, nama: true, kategori: true, gender: true, nis: true, batasAktifDufah: true, noWaSantri: true, noWaOrtu: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } },
        dufah: { select: { id: true, nama: true } },
      },
      orderBy: { id: 'desc' }, // Terbaru duluan
      distinct: ['santriId']   // Hanya ambil 1 record terbaru per santri
    });

    const belum = allRiwayat
      .filter(r => !r.isIdCardTaken)
      .sort((a, b) => a.santri.nama.localeCompare(b.santri.nama));

    const sudah = allRiwayat
      .filter(r => r.isIdCardTaken)
      .sort((a, b) => {
        const timeA = a.waktuAmbilKartu ? a.waktuAmbilKartu.getTime() : 0;
        const timeB = b.waktuAmbilKartu ? b.waktuAmbilKartu.getTime() : 0;
        return timeA - timeB;
      });

    return NextResponse.json({ belum, sudah, dufahNama: dufahLabel, daftarDufah: allDufahList });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json(); 

    // Gunakan Transaction untuk mencegah Race Condition saat pembuatan nomor urut
    const updated = await prisma.$transaction(async (tx) => {
      const riwayatCurrent = await tx.riwayatDufah.findUnique({ where: { id } });
      if (!riwayatCurrent) throw new Error("Data riwayat tidak ditemukan");

      // Cari nomor ID Card tertinggi di Duf'ah yang sama
      const maxData = await tx.riwayatDufah.aggregate({
        where: { dufahId: riwayatCurrent.dufahId },
        _max: { nomorIdCard: true }
      });

      const nextNomor = (maxData._max.nomorIdCard || 0) + 1;

      return await tx.riwayatDufah.update({
        where: { id },
        data: { 
          isIdCardTaken: true,
          waktuAmbilKartu: new Date(),
          nomorIdCard: nextNomor
        },
        include: { santri: { select: { nama: true } } }
      });
    });

    emitDataUpdate("id-card");
    emitNotification("idcard", `💳 [No. ${updated.nomorIdCard}] ${updated.santri.nama} telah menerima ID Card`, { nama: updated.santri.nama });

    return NextResponse.json({ message: "ID Card berhasil diserahkan", data: updated });
  } catch (error) {
    console.error("Error in PATCH /api/id-card:", error);
    return NextResponse.json({ error: "Gagal verifikasi" }, { status: 500 });
  }
}