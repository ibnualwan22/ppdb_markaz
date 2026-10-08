import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/asrama/cari-santri?q=...
 * Pencarian tahap 2 (meja asrama & meja ID card): dipakai saat pencarian
 * di antrean tidak menemukan hasil. Fuzzy via pg_trgm (toleran typo) + ILIKE.
 *
 * CAKUPAN DIBATASI: hanya santri dufah aktif — yang punya riwayat di dufah
 * aktif ATAU transaksi yang menargetkan dufah aktif (alur meja keuangan).
 * Tidak mencari ke seluruh master santri.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 3) return NextResponse.json([]);

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json([]);
    const dufahAktifId = dufahAktif.id;

    // Fuzzy search dalam cakupan dufah aktif saja
    const hasil = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM "Santri" s
      WHERE (s.nama % ${q} OR s.nama ILIKE ${"%" + q + "%"})
        AND (
          EXISTS (SELECT 1 FROM "RiwayatDufah" r WHERE r."santriId" = s.id AND r."dufahId" = ${dufahAktifId})
          OR EXISTS (SELECT 1 FROM "TransaksiPendaftaran" t WHERE t."santriId" = s.id AND t."dufahTujuanId" = ${dufahAktifId})
        )
      ORDER BY similarity(s.nama, ${q}) DESC
      LIMIT 10
    `;
    if (hasil.length === 0) return NextResponse.json([]);

    const ids = hasil.map((h) => h.id);
    const daftar = await prisma.santri.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        nama: true,
        kategori: true,
        gender: true,
        isAktif: true,
        nis: true,
        program: { select: { kategoriProgram: true } },
        riwayat: {
          where: dufahAktif ? { dufahId: dufahAktif.id } : undefined,
          select: {
            id: true,
            isLunas: true,
            status: true,
            lemari: {
              select: {
                nomor: true,
                kamar: { select: { nama: true, sakan: { select: { nama: true } } } },
              },
            },
          },
        },
        transaksi: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            statusPembayaran: true,
            dufahTujuanId: true,
            program: { select: { kategoriProgram: true } },
            dufahTujuan: { select: { nama: true } },
          },
        },
      },
    });

    const labelProgram: Record<string, string> = {
      REGULER: "Reguler",
      TUROTS: "Turats",
      "2MINGGU": "2 Minggu",
    };
    const byId = new Map(daftar.map((s) => [s.id, s]));

    const hasilAkhir = ids
      .map((id) => byId.get(id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => {
        const rw = s.riwayat[0];
        const trxAktif = s.transaksi.find((t) => t.dufahTujuanId === dufahAktifId);
        const trxTerbaru = s.transaksi[0];
        const katProgram =
          s.program?.kategoriProgram ||
          trxAktif?.program?.kategoriProgram ||
          trxTerbaru?.program?.kategoriProgram;
        const programLabel = katProgram ? labelProgram[katProgram] || katProgram : "-";

        let statusBayar = "-";
        let statusTempat = "";
        let riwayatId: string | null = null;

        if (rw) {
          statusBayar = rw.isLunas ? "Lunas" : "Belum lunas";
          if (rw.lemari) {
            statusTempat = `Kamar ${rw.lemari.kamar.sakan.nama} ${rw.lemari.kamar.nama} / Lemari ${rw.lemari.nomor}`;
          } else if (rw.status === "CHECKED_OUT") {
            statusTempat = "Check out";
          } else {
            statusTempat = "Menunggu kamar";
            riwayatId = rw.id;
          }
        } else {
          // Tanpa riwayat dufah aktif: pasti ada transaksi dufah aktif (jaminan query di atas)
          const trx = trxAktif || trxTerbaru;
          const pending = trx && ["PENDING", "MENUNGGU"].includes(trx.statusPembayaran);
          if (pending) {
            statusBayar = "Menunggu verifikasi";
            statusTempat = "Terdaftar, menunggu verifikasi keuangan";
          } else {
            statusBayar = "Lunas";
            statusTempat = "Sudah bayar, menunggu pembuatan riwayat";
          }
        }

        return {
          santriId: s.id,
          nama: s.nama,
          kategori: s.kategori,
          gender: s.gender,
          nis: s.nis,
          programLabel,
          statusBayar,
          statusTempat,
          riwayatId, // tidak null => ada di antrean, bisa langsung ditempatkan
        };
      });

    return NextResponse.json(hasilAkhir);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencari santri" }, { status: 500 });
  }
}
