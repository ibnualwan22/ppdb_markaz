import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { checkPermission } from "@/lib/checkPermission";

export async function GET(req: NextRequest) {
  try {
    // 1. Cek Permission via API Key (Headers x-api-key)
    const auth = await checkPermission(req, "integrasi_siakad");
    if (!auth.allowed) {
      return NextResponse.json({ error: auth.reason || "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const nis = searchParams.get("nis");

    if (!nis) {
      return NextResponse.json({ error: "Parameter 'nis' wajib disertakan di URL." }, { status: 400 });
    }

    // 2. Ambil data santri dan relasi ke expiredDufah (jika ada relasinya, tapi expiredDufahId murni integer, jadi ambil manual)
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
          select: {
            id: true,
            nama: true,
            kategoriProgram: true
          }
        }
      }
    });

    if (!santri) {
      return NextResponse.json({ error: `Santri dengan NIS ${nis} tidak ditemukan.` }, { status: 404 });
    }

    // Ambil nama Dufah tempat dia expired (masa akhir durasinya)
    let namaExpiredDufah = null;
    if (santri.expiredDufahId) {
       const dufah = await prisma.dufah.findUnique({ where: { id: santri.expiredDufahId } });
       if (dufah) namaExpiredDufah = dufah.nama;
    }

    // Ambil dufah yang saat ini sedang aktif secara global sebagai referensi
    const currentActiveDufah = await prisma.dufah.findFirst({
        where: { isActive: true },
        select: { id: true, nama: true }
    });

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
           sisaKoutaBulan: santri.saldoDufah, // Saldo bulan/dufah yang masih tersisa
           berakhirPadaDufahId: santri.expiredDufahId,
           berakhirPadaDufahNama: namaExpiredDufah || "Belum Ditentukan",
           dufahSekarangSistem: currentActiveDufah // Untuk referensi pihak SIAKAD
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error Integrasi SIAKAD Check Status:", error);
    return NextResponse.json({ error: "Gagal mengambil data status santri", details: error.message }, { status: 500 });
  }
}
