import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { santriId, isCuti } = await request.json();

    if (!santriId) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

    const santri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!santri) return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ error: "Tidak ada Duf'ah aktif" }, { status: 400 });

    if (isCuti) {
      // Jika mengajukan cuti
      // Hitung sisa saldo (Bulan aktif sekarang dianggap terpakai/hangus)
      const saldoDufah = Math.max(0, santri.batasAktifDufah - dufahAktif.id);
      
      // Expired dalam 6 bulan dari sekarang
      const expiredDufahId = dufahAktif.id + 6;

      await prisma.santri.update({
        where: { id: santri.id },
        data: {
          isCuti: true,
          saldoDufah,
          expiredDufahId,
          isAktif: false // otomatis non-aktif, batasAktifDufah tidak dirubah agar bisa di-undo
        }
      });
      
      return NextResponse.json({ message: "Santri berhasil dicutikan." });
    } else {
      // Batal Cuti / Aktifkan dari Cuti
      if (!santri.isCuti) return NextResponse.json({ error: "Santri tidak dalam status Cuti" }, { status: 400 });
      
      const originDufahId = santri.expiredDufahId ? santri.expiredDufahId - 6 : 0;

      // 1. UNDO LOGIC: Jika diaktifkan kembali di bulan yang sama saat ia mengajukan cuti
      if (originDufahId === dufahAktif.id) {
        await prisma.santri.update({
          where: { id: santri.id },
          data: {
            isCuti: false,
            saldoDufah: 0,
            expiredDufahId: null,
            isAktif: true
            // batasAktifDufah tidak perlu dirubah karena masih utuh
          }
        });
        return NextResponse.json({ message: "Pengajuan Cuti dibatalkan (Undo) karena masih di bulan yang sama." });
      }

      // 2. NORMAL RETURN LOGIC
      if (santri.expiredDufahId && dufahAktif.id > santri.expiredDufahId) {
        // Hangus
        await prisma.santri.update({
          where: { id: santri.id },
          data: {
            isCuti: false,
            saldoDufah: 0,
            expiredDufahId: null
          }
        });
        return NextResponse.json({ error: "Masa cuti sudah expired. Sisa Duf'ah hangus." }, { status: 400 });
      }

      // Aktifkan lagi, tambahkan saldoDufah ke batasAktif
      const newBatasAktif = dufahAktif.id + santri.saldoDufah - 1;

      await prisma.santri.update({
        where: { id: santri.id },
        data: {
          isCuti: false,
          saldoDufah: 0,
          expiredDufahId: null,
          isAktif: true,
          batasAktifDufah: newBatasAktif
        }
      });

      return NextResponse.json({ message: "Cuti berhasil dicabut dan Santri kembali Aktif." });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Gagal memproses cuti", details: error.message }, { status: 500 });
  }
}
