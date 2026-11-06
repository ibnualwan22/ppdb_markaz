import prisma from "@/lib/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";
import { jalankanRolloverDufah } from "@/app/lib/rollover-dufah";
import { checkPermission } from "@/lib/checkPermission";

/**
 * PATCH /api/dufah/[id]/active — tombol "Set Aktif" lama di UI PPDB.
 *
 * Fase 7: (a) DIKUNCI — hanya sesi dengan izin manage_dufah (atau
 * all_access) ATAU API key Bawwabah; tanpa keduanya -> 401/403.
 * Sebelumnya endpoint ini tanpa autentikasi sama sekali.
 * (b) Logika rollover dipindah ke fungsi bersama
 * `jalankanRolloverDufah` (dipakai juga endpoint Bawwabah) dan
 * dijalankan DALAM SATU transaksi — sebelumnya tiap langkah query
 * terpisah tanpa transaksi, sehingga gagal di tengah meninggalkan
 * status setengah jalan yang tidak bisa diperbaiki dengan memanggil
 * ulang. Perilaku lain tidak berubah: isTahunBaru tetap dibaca dari
 * baris dufah (PPDB tidak punya UI untuk flag itu), webhook tetap
 * ditunggu seperti sebelumnya.
 */
function kunciBawwabahValid(req: NextRequest): boolean {
  const key = process.env.BAWABAH_API_KEY;
  if (!key) return false;
  const got = req.headers.get("x-bawwabah-key");
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(key);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Kunci: sesi berizin ATAU kunci Bawwabah.
  const izin = await checkPermission(request, "manage_dufah");
  if (!izin.allowed && !kunciBawwabahValid(request)) {
    const status = izin.reason?.startsWith("Forbidden") ? 403 : 401;
    return NextResponse.json(
      { error: izin.reason || "Unauthorized" },
      { status }
    );
  }

  try {
    const { id } = await params;
    const dufahIdBaru = parseInt(id);
    if (!Number.isInteger(dufahIdBaru) || dufahIdBaru <= 0) {
      return NextResponse.json({ error: "ID Duf'ah tidak valid" }, { status: 400 });
    }

    const target = await prisma.dufah.findUnique({ where: { id: dufahIdBaru } });
    if (!target) {
      return NextResponse.json({ error: "Duf'ah tidak ditemukan" }, { status: 404 });
    }
    if (target.isActive) {
      return NextResponse.json(
        { error: `Duf'ah "${target.nama}" sudah aktif` },
        { status: 409 }
      );
    }

    // isTahunBaru dibaca dari baris (satu-satunya sumber di PPDB).
    const hasil = await prisma.$transaction(async (tx) =>
      jalankanRolloverDufah(tx, {
        dufahIdBaru,
        isTahunBaru: target.isTahunBaru,
      })
    );

    await notifySiakadWebhook();

    return NextResponse.json({
      message: `${hasil.namaDufah} aktif. Logika batas aktif dan siklus asrama berhasil diterapkan.`,
      data: { id: hasil.dufahId, nama: hasil.namaDufah },
    });
  } catch (error) {
    console.error("Gagal aktivasi dufah:", error);
    return NextResponse.json({ error: "Gagal mengaktifkan Duf'ah" }, { status: 500 });
  }
}
