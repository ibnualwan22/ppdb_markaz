import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "AKTIF"; // Default adalah AKTIF

    let filterPencarian: any = {};

    if (filter === "AKTIF") {
      // MODE 1: Hanya santri yang saat ini masih di Markaz
      filterPencarian = { isAktif: true };
    } else if (filter === "ALL") {
      // MODE 2: Global (Termasuk yang sudah Check Out)
      filterPencarian = {}; 
    } else {
      // MODE 3: Historis (Siapa saja yang mendaftar di Duf'ah X)
      const dufahId = parseInt(filter);
      if (!isNaN(dufahId)) {
        filterPencarian = {
          riwayat: {
            some: { dufahId: dufahId }
          }
        };
      }
    }

    // BASE FILTER: Hanya muncul jika SUDAH diverifikasi, ATAU punya NIS, ATAU punya Riwayat Kamar
    // (Untuk menyembunyikan pendaftar baru yang baru sebatas isi form dan belum lunas)
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

    const dataSantri = await prisma.santri.findMany({
      where: finalFilter,
      include: {
        riwayat: {
          include: {
            dufah: true,
            lemari: { include: { kamar: { include: { sakan: true } } } }
          },
          orderBy: { dufahId: 'desc' }
        },
        transaksi: {
          include: {
            program: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { nama: 'asc' }
    });

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
          return b.dufahId - a.dufahId; // Descending
        });
      }
      return santri;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data master santri" }, { status: 500 });
  }
}