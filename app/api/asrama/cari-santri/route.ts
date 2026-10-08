import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/asrama/cari-santri?q=...
 * Pencarian global santri (tahap 2): dipakai saat pencarian di antrean
 * tidak menemukan hasil. Fuzzy via pg_trgm (toleran typo) + ILIKE.
 * Mengembalikan max 10 santri beserta status bayar & status penempatan,
 * agar admin paham KENAPA santri tidak ada di antrean.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 3) return NextResponse.json([]);

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });

    // Fuzzy search: operator % = similarity di atas threshold pg_trgm,
    // ILIKE sebagai fallback untuk potongan nama.
    const hasil = await prisma.$queryRaw<{ id: string }[]>`
      SELECT s.id
      FROM "Santri" s
      WHERE s.nama % ${q} OR s.nama ILIKE ${"%" + q + "%"}
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
        const trxAktif = dufahAktif
          ? s.transaksi.find((t) => t.dufahTujuanId === dufahAktif.id)
          : undefined;
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
        } else if (!s.isAktif) {
          statusTempat = "Nonaktif";
        } else {
          const trxPending = s.transaksi.find((t) =>
            ["PENDING", "MENUNGGU"].includes(t.statusPembayaran)
          );
          if (trxPending) {
            statusBayar = "Menunggu verifikasi";
            statusTempat = trxPending.dufahTujuan
              ? `Terdaftar ${trxPending.dufahTujuan.nama}, menunggu verifikasi keuangan`
              : "Terdaftar, menunggu verifikasi keuangan";
          } else if (trxTerbaru?.dufahTujuan) {
            statusTempat = `Terdaftar untuk ${trxTerbaru.dufahTujuan.nama}`;
            statusBayar = "Lunas";
          } else {
            statusTempat = "Belum ada riwayat dufah aktif";
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
