import React from "react";
import prisma from "@/lib/prisma";
import TauziFushulTable from "@/components/TauziFushulTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tauzi' Fushul | Markaz Arabiyah",
  description: "Halaman penempatan kelas (Tauzi' Fushul) santri Markaz Arabiyah.",
};

// Pastikan halaman ini dinamis karena kita butuh data terbaru
export const dynamic = "force-dynamic";

export default async function TauziFushulPage() {
  // Ambil data langsung dari database
  const dataSantri = await prisma.santri.findMany({
    where: {
      isAktif: true,
      kategori: { not: "KSU" },
      riwayat: {
        some: {
          dufah: { isActive: true }
        }
      }
    },
    include: {
      riwayat: {
        where: { dufah: { isActive: true } },
        include: { dufah: true }
      },
      transaksi: {
        include: { program: true },
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    },
    orderBy: { nama: 'asc' }
  });

  const formattedData = dataSantri.map(santri => {
    const activeRiwayat = santri.riwayat[0];
    const programPilihan = santri.transaksi[0]?.program?.nama || "Belum Memilih Program";
    
    return {
      santriId: santri.id,
      nama: santri.nama,
      gender: santri.gender,
      kategori: santri.kategori,
      nis: santri.nis,
      program: programPilihan,
      riwayatId: activeRiwayat?.id,
      nilaiTauzi: (activeRiwayat as any)?.nilaiTauzi || null,
      kelasRekomendasi: (activeRiwayat as any)?.kelasRekomendasi || programPilihan,
    };
  });

  return (
    <div className="min-h-screen bg-dark-900 bg-luxury-pattern text-gray-200 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gold-500 tracking-wide sm:text-4xl drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
          Sistem Penempatan Kelas (Tauzi' Fushul)
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400 mx-auto">
          Halaman sementara untuk pengelolaan pre-test dan rekomendasi kelas.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <TauziFushulTable initialData={formattedData} />
      </div>
    </div>
  );
}
