import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ data: [], dufahNama: "Tidak ada Duf'ah Aktif" });

    // Cari juga Duf'ah yang sedang buka pendaftaran (berdasarkan tanggal)
    const now = new Date();
    const allDufahs = await prisma.dufah.findMany();
    const dufahTarget = allDufahs.find(df => {
      if (!df.tanggalBuka || !df.tanggalTutup) return false;
      return now >= new Date(df.tanggalBuka) && now <= new Date(df.tanggalTutup);
    });

    // Kumpulkan ID dufah yang relevan
    // PRIORITAS: Hanya tampilkan yang aktif sekarang agar tidak tercampur dengan calon santri bulan depan.
    const relevantDufahIds = [dufahAktif.id];

    const data = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: { in: relevantDufahIds },
        isLunas: true,
        status: { not: "CHECKED_OUT" },
      },
      include: {
        santri: { select: { id: true, nama: true, gender: true, nis: true, kategori: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } }
      },
      orderBy: {
        nomorIdCard: { sort: 'asc', nulls: 'last' }
      }
    });

    // Cari transaksi untuk melihat apakah santri ini beli atribut
    const transaksiList = await prisma.transaksiPendaftaran.findMany({
      where: {
        dufahTujuanId: { in: relevantDufahIds },
        santriId: { in: data.map(d => d.santri.id) },
        statusPembayaran: { in: ["PAID", "KSU_GRATIS", "KLAIM_PAKET"] }
      },
      include: { program: true }
    });

    const dataWithAtribut = data.map(d => {
      // Cari transaksi yang berkaitan
      // Karena bisa jadi ada renew, kita cari yang paling baru (terakhir diverifikasi/lunas)
      const txs = transaksiList.filter(t => t.santriId === d.santri.id && t.dufahTujuanId === d.dufahId);
      let isBeliAtribut = true;

      if (txs.length > 0) {
        // Ambil transaksi terbaru (berdasarkan id tertinggi)
        const tx = txs.sort((a, b) => b.id.localeCompare(a.id))[0];
        if (tx.statusPembayaran === "KLAIM_PAKET") {
          isBeliAtribut = false;
        } else if (tx.program && tx.nominalProgram < tx.program.harga) {
          isBeliAtribut = false;
        }
      } else {
        // Jika tidak ada transaksi sama sekali di Duf'ah ini (misal input manual, atau lanjut paket)
        if (d.santri.kategori === "LAMA") {
          // Santri lama yang tidak punya transaksi baru otomatis tidak dapat
          isBeliAtribut = false;
        } else if (d.bulanKe > 1) {
          // Santri (KSU/BARU) yang melanjutkan ke bulan 2 dan seterusnya otomatis tidak dapat
          isBeliAtribut = false;
        } else {
          // Santri BARU di bulan pertamanya (misal diinput manual oleh Admin) wajib dapat
          isBeliAtribut = true;
        }
      }

      return {
        ...d,
        isBeliAtribut
      };
    });

    const dufahLabel = dufahAktif.nama;

    return NextResponse.json({ data: dataWithAtribut, dufahNama: dufahLabel });
  } catch (error) {
    console.error("Error GET /api/mimstore:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, field, value } = body;

    // Allowed fields to prevent unauthorized updates
    const allowedFields = [
      'isDresscodeTaken',
      'ukuranDresscode',
      'isToteBagTaken',
      'isPinTaken',
      'isSongkokKhimarTaken',
      'ukuranSongkok',
      'isMalzamahTaken',
      'isTabirotTaken'
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Field tidak valid" }, { status: 400 });
    }

    const updated = await prisma.riwayatDufah.update({
      where: { id },
      data: { [field]: value }
    });

    emitDataUpdate("mimstore");

    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    const pelaku = u ? `${u.name} (@${u.username})` : "Admin";

    await logActivity({
      aksi: "UPDATE",
      modul: "Mimstore",
      deskripsi: `Memperbarui atribut "${field}" menjadi "${value}" untuk santri ID: ${id}`,
      namaUser: pelaku,
      userId: u?.id,
      targetId: id,
    });

    return NextResponse.json({ message: "Berhasil diupdate", data: updated });
  } catch (error) {
    console.error("Error PATCH /api/mimstore:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}
