import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Daftar field yang wajib lengkap
const REQUIRED_FIELDS = [
  "tempatLahir",
  "tanggalLahir",
  "namaOrtu",
  "noWaOrtu",
  "noWaSantri",
  "provinsi",
  "kabupaten",
  "kecamatan",
  "desa",
  "detailAlamat",
] as const;

function isDataLengkap(santri: any): boolean {
  return REQUIRED_FIELDS.every((field) => {
    const val = santri[field];
    return val !== null && val !== undefined && val !== "";
  });
}

// GET: Cari santri berdasarkan nama (untuk autocomplete)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

    const santriList = await prisma.santri.findMany({
      where: {
        isAktif: true,
        nama: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        nama: true,
        nis: true,
        kategori: true,
        gender: true,
        tempatLahir: true,
        tanggalLahir: true,
        namaOrtu: true,
        noWaOrtu: true,
        noWaSantri: true,
        provinsi: true,
        kabupaten: true,
        kecamatan: true,
        desa: true,
        detailAlamat: true,
        riwayat: {
          orderBy: { dufahId: "desc" },
          take: 1,
          select: {
            lemari: {
              select: {
                nomor: true,
                kamar: {
                  select: {
                    nama: true,
                    sakan: {
                      select: {
                        nama: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { nama: "asc" },
      take: 20,
    });

    const result = santriList.map((s: any) => {
      const latestRiwayat = s.riwayat?.[0];
      const sakan = latestRiwayat?.lemari?.kamar?.sakan?.nama || null;
      const kamar = latestRiwayat?.lemari?.kamar?.nama || null;
      const lemari = latestRiwayat?.lemari?.nomor || null;

      const lengkap = isDataLengkap(s);

      // Hapus data pribadi dari response jika sudah lengkap
      if (lengkap) {
        return {
          id: s.id,
          nama: s.nama,
          nis: s.nis,
          kategori: s.kategori,
          gender: s.gender,
          isLengkap: true,
          sakan,
          kamar,
          lemari,
        };
      }

      return {
        ...s,
        sakan,
        kamar,
        lemari,
        isLengkap: false,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error search santri publik:", error);
    return NextResponse.json(
      { error: "Gagal mencari data santri" },
      { status: 500 }
    );
  }
}
