import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/santri/siakad
 * 
 * Endpoint khusus untuk Sistem Akademik (Siakad) Markaz Arabiyah.
 * Mengembalikan SEMUA santri aktif tanpa pagination,
 * dalam format flat array (backward-compatible dengan API lama).
 * 
 * Query Params:
 *   - filter: "AKTIF" (default) | "ALL" | dufahId (number)
 *   - key: API key untuk autentikasi sederhana
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // ==========================================
    // 1. AUTENTIKASI SEDERHANA
    // ==========================================
    const apiKey = searchParams.get("key");
    const validKey = process.env.SIAKAD_API_KEY || "markaz-siakad-api-2026";
    
    if (apiKey !== validKey) {
      return NextResponse.json(
        { error: "Unauthorized. Sertakan parameter ?key=YOUR_API_KEY" },
        { status: 401 }
      );
    }

    // ==========================================
    // 2. FILTER
    // ==========================================
    const filter = searchParams.get("filter") || "AKTIF";

    let filterPencarian: any = {};

    if (filter === "AKTIF") {
      filterPencarian = { isAktif: true };
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

    // Base filter: hanya santri valid (punya NIS / riwayat / transaksi lunas)
    const baseFilter = {
      OR: [
        { nis: { not: null } },
        { riwayat: { some: {} } },
        { transaksi: { some: { statusPembayaran: { in: ["PAID", "KSU_GRATIS", "KLAIM_PAKET"] } } } }
      ]
    };

    const finalFilter = {
      AND: [baseFilter, filterPencarian]
    };

    // ==========================================
    // 3. AMBIL SEMUA DATA (Tanpa Pagination)
    // ==========================================
    const dataSantri = await prisma.santri.findMany({
      where: finalFilter,
      include: {
        riwayat: {
          include: {
            dufah: true,
            lemari: { include: { kamar: { include: { sakan: true } } } }
          },
          orderBy: { dufahId: 'desc' as const }
        },
        transaksi: {
          include: { program: true },
          orderBy: { createdAt: 'desc' as const },
          take: 1
        }
      },
      orderBy: { nama: 'asc' }
    });

    // ==========================================
    // 4. SORT RIWAYAT (aktif dulu)
    // ==========================================
    const requestedDufahId = (filter !== "AKTIF" && filter !== "ALL") ? parseInt(filter) : null;

    const result = dataSantri.map((santri: any) => {
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

    // ==========================================
    // 5. RETURN: Flat array (kompatibel dengan API lama)
    // ==========================================
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      }
    });

  } catch (error) {
    console.error("Error GET /api/santri/siakad:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data santri untuk Siakad" },
      { status: 500 }
    );
  }
}
