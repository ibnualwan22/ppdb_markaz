import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "AKTIF";
    const mode = searchParams.get("mode"); // "export" = ambil semua tanpa limit
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "";
    const kategori = searchParams.get("kategori") || "";
    const bulanKe = searchParams.get("bulanKe") || "";
    const sakan = searchParams.get("sakan") || "";
    const program = searchParams.get("program") || "";

    // ==========================================
    // 1. FILTER PERIODE DUF'AH
    // ==========================================
    let filterPencarian: any = {};

    if (filter === "AKTIF") {
      filterPencarian = {
        OR: [
          { isAktif: true },
          { riwayat: { some: { dufah: { isActive: true } } } }
        ]
      };
    } else if (filter === "ALL") {
      filterPencarian = {};
    } else {
      const dufahId = parseInt(filter);
      if (!isNaN(dufahId)) {
        filterPencarian = {
          riwayat: {
            some: { dufahId: dufahId }
          }
        };
      }
    }

    // ==========================================
    // 2. BASE FILTER (Menyembunyikan pendaftar belum lunas)
    // ==========================================
    const baseFilter = {
      OR: [
        { nis: { not: null } },
        { riwayat: { some: {} } },
        { transaksi: { some: { statusPembayaran: { in: ["PAID", "KSU_GRATIS", "KLAIM_PAKET"] } } } }
      ]
    };

    // ==========================================
    // 3. FILTER PENCARIAN & DROPDOWN (Server-Side)
    // ==========================================
    const additionalFilters: any[] = [];

    // Filter Pencarian Nama
    if (search) {
      additionalFilters.push({ nama: { contains: search, mode: "insensitive" } });
    }

    // Filter Gender
    if (gender && gender !== "SEMUA") {
      additionalFilters.push({ gender: gender });
    }

    // Filter Kategori
    if (kategori && kategori !== "SEMUA") {
      additionalFilters.push({ kategori: kategori });
    }

    // Filter Bulan Ke (memerlukan relasi RiwayatDufah)
    if (bulanKe && bulanKe !== "SEMUA") {
      additionalFilters.push({
        riwayat: { some: { bulanKe: parseInt(bulanKe) } }
      });
    }

    // Filter Sakan (memerlukan relasi nested)
    if (sakan && sakan !== "SEMUA") {
      additionalFilters.push({
        riwayat: {
          some: {
            lemari: {
              kamar: {
                sakan: { nama: sakan }
              }
            }
          }
        }
      });
    }

    // Filter Program (Turots / Reguler)
    if (program && program !== "SEMUA") {
      additionalFilters.push({
        OR: [
          { program: { kategoriProgram: program } },
          {
            AND: [
              { programId: null },
              { transaksi: { some: { program: { kategoriProgram: program } } } }
            ]
          }
        ]
      });
    }

    // ==========================================
    // 4. GABUNGKAN SEMUA FILTER
    // ==========================================
    const finalFilter = {
      AND: [baseFilter, filterPencarian, ...additionalFilters]
    };

    const includeRelations = {
      program: true,
      riwayat: {
        include: {
          dufah: true,
          lemari: { include: { kamar: { include: { sakan: true } } } }
        },
        orderBy: { dufahId: 'desc' as const }
      },
      transaksi: {
        include: {
          program: true
        },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    };

    // ==========================================
    // 5. MODE EXPORT: Ambil semua tanpa limit (untuk Excel/PDF/Laporan WA)
    // ==========================================
    if (mode === "export") {
      const dataSantri = await prisma.santri.findMany({
        where: finalFilter,
        include: includeRelations,
        orderBy: { nama: 'asc' }
      });

      const requestedDufahId = (filter !== "AKTIF" && filter !== "ALL") ? parseInt(filter) : null;
      const result = sortRiwayat(dataSantri, requestedDufahId);

      return NextResponse.json(result);
    }

    // ==========================================
    // 6. MODE NORMAL: Server-Side Pagination
    // ==========================================
    const skip = (page - 1) * limit;

    // Hitung total untuk pagination meta
    const totalItems = await prisma.santri.count({ where: finalFilter });

    const dataSantri = await prisma.santri.findMany({
      where: finalFilter,
      include: includeRelations,
      orderBy: { nama: 'asc' },
      skip,
      take: limit,
    });

    const requestedDufahId = (filter !== "AKTIF" && filter !== "ALL") ? parseInt(filter) : null;
    const result = sortRiwayat(dataSantri, requestedDufahId);

    // ==========================================
    // 7. AMBIL DAFTAR SAKAN UNIK (untuk dropdown filter di Frontend)
    // ==========================================
    const sakanList = await prisma.sakan.findMany({
      select: { nama: true },
      orderBy: { nama: 'asc' }
    });

    return NextResponse.json({
      data: result,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
      sakanList: sakanList.map(s => s.nama),
    });
  } catch (error) {
    console.error("Error GET /api/santri:", error);
    return NextResponse.json({ error: "Gagal mengambil data master santri" }, { status: 500 });
  }
}


// ==========================================
// HELPER: Urutkan riwayat agar Duf'ah yang diminta atau aktif berada di posisi pertama
// ==========================================
function sortRiwayat(dataSantri: any[], requestedDufahId: number | null) {
  return dataSantri.map((santri: any) => {
    if (santri.riwayat && santri.riwayat.length > 1) {
      santri.riwayat.sort((a: any, b: any) => {
        if (requestedDufahId && !isNaN(requestedDufahId)) {
          if (a.dufahId === requestedDufahId && b.dufahId !== requestedDufahId) return -1;
          if (a.dufahId !== requestedDufahId && b.dufahId === requestedDufahId) return 1;
        }
        if (a.dufah?.isActive && !b.dufah?.isActive) return -1;
        if (!a.dufah?.isActive && b.dufah?.isActive) return 1;
        return b.dufahId - a.dufahId;
      });
    }
    return santri;
  });
}