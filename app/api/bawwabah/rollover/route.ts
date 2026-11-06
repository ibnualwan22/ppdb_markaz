import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";
import { jalankanRolloverDufah } from "@/app/lib/rollover-dufah";

/**
 * POST /api/bawwabah/rollover — endpoint khusus Bawwabah (Fase 7).
 *
 * Bawwabah memanggil ini SEKALI per periode saat super admin menekan
 * Aktifkan di /periode. Endpoint ini menjalankan rollover PPDB
 * (auto-CO + flip BARU->LAMA + migrasi + mutasi) DALAM SATU transaksi,
 * lalu menembak webhook ke Siakad (fire-and-forget, setelah komit).
 *
 * Auth: header `x-bawwabah-key` == env BAWABAH_API_KEY. Tanpa key -> 401.
 * Key ini BERBEDA dengan PPDB_WEBHOOK_SECRET (arah PPDB -> Siakad).
 *
 * Body: { dufahId, namaDufah, isTahunBaru, idempotencyKey }
 *   - dufahId: id INT baris Dufah target di PPDB (Bawwabah mencarinya
 *     dulu lewat GET /api/dufah berdasarkan nama).
 *   - namaDufah: harus sama persis dengan nama baris target (penjaga
 *     terhadap dufah target yang salah).
 *   - isTahunBaru: nilai FINAL dari Bawwabah — ditulis ke baris dufah
 *     sebelum rollover (PPDB tidak punya UI untuk flag ini).
 *   - idempotencyKey: id periode Bawwabah (p-<cuid>), satu kunci per
 *     periode. Panggilan ulang dengan key yang sama mengembalikan hasil
 *     rollover sebelumnya tanpa mengulang (200).
 *
 * Respons sukses: { ok, sudahDilakukan, dufahId, namaDufah, coCount,
 *   flipCount, riwayatBaru, mutasiCount, santriAktif, webhook }
 *   - webhook: "pending" — pengumuman ke Siakad dikirim tanpa menunggu
 *     (sync Siakad lambat); Bawwabah memverifikasi sendiri lewat baca
 *     dufah aktif PPDB + status Siakad, dan menyediakan tombol Kirim Ulang.
 *
 * TIDAK PERNAH mengaktifkan periode sungguhan dari endpoint ini tanpa
 * panggilan Bawwabah yang sah — dan tidak ada jalan kembali (keputusan
 * no. 19): tidak ada endpoint untuk mengaktifkan ulang periode lama.
 */

function kunciBawwabahValid(req: Request): boolean {
  const key = process.env.BAWABAH_API_KEY;
  if (!key) return false;
  const got = req.headers.get("x-bawwabah-key");
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(key);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!kunciBawwabahValid(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const dufahId = typeof body.dufahId === "number" ? body.dufahId : NaN;
  const namaDufah = typeof body.namaDufah === "string" ? body.namaDufah : "";
  const isTahunBaru = body.isTahunBaru === true;
  const idempotencyKey =
    typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";

  if (!Number.isInteger(dufahId) || dufahId <= 0) {
    return NextResponse.json({ error: "dufahId tidak valid" }, { status: 400 });
  }
  if (!namaDufah.trim()) {
    return NextResponse.json({ error: "namaDufah wajib diisi" }, { status: 400 });
  }
  if (!idempotencyKey.trim()) {
    return NextResponse.json({ error: "idempotencyKey wajib diisi" }, { status: 400 });
  }

  try {
    // --- Idempotensi: key yang sama tidak boleh mengulang rollover. ---
    const logLama = await prisma.rolloverLog.findUnique({
      where: { idempotencyKey },
    });
    if (logLama) {
      if (logLama.status === "OK") {
        const ringkasan = (logLama.summary ?? {}) as Record<string, unknown>;
        return NextResponse.json({
          ok: true,
          sudahDilakukan: true,
          dufahId: logLama.dufahId,
          namaDufah,
          ...ringkasan,
          webhook: "pending",
        });
      }
      if (logLama.status === "RUNNING") {
        return NextResponse.json(
          { error: "Rollover dengan kunci ini sedang berjalan" },
          { status: 409 }
        );
      }
      // FAILED: transaksi dulu di-rollback (tidak ada yang berubah), jadi
      // boleh dicoba lagi dengan kunci yang sama.
    }

    // --- Validasi target (sebelum apa pun berubah). ---
    const target = await prisma.dufah.findUnique({ where: { id: dufahId } });
    if (!target) {
      return NextResponse.json({ error: "Dufah target tidak ditemukan" }, { status: 404 });
    }
    if (target.nama !== namaDufah) {
      return NextResponse.json(
        {
          error: `Nama tidak cocok: baris id ${dufahId} bernama "${target.nama}", bukan "${namaDufah}"`,
        },
        { status: 400 }
      );
    }
    if (target.isActive) {
      return NextResponse.json(
        { error: `Dufah "${target.nama}" sudah aktif — tidak ada yang dijalankan` },
        { status: 409 }
      );
    }

    // --- Catat niat rollover (kunci idempotensi; @unique menjaga balapan). ---
    try {
      if (logLama) {
        await prisma.rolloverLog.update({
          where: { idempotencyKey },
          data: { status: "RUNNING", startedAt: new Date(), finishedAt: null, dufahId },
        });
      } else {
        await prisma.rolloverLog.create({
          data: {
            dufahId,
            idempotencyKey,
            triggeredBy: "bawwabah",
            status: "RUNNING",
          },
        });
      }
    } catch {
      // Balapan dengan panggilan lain yang memakai kunci sama.
      return NextResponse.json(
        { error: "Rollover dengan kunci ini sedang berjalan" },
        { status: 409 }
      );
    }

    // --- Jalankan rollover DALAM SATU transaksi. ---
    let hasil;
    try {
      hasil = await prisma.$transaction(async (tx) =>
        jalankanRolloverDufah(tx, { dufahIdBaru: dufahId, isTahunBaru })
      );
    } catch (e) {
      console.error("Rollover Bawwabah gagal (transaksi di-rollback):", e);
      await prisma.rolloverLog
        .update({
          where: { idempotencyKey },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            summary: { error: e instanceof Error ? e.message : "gagal" },
          },
        })
        .catch(() => undefined);
      return NextResponse.json(
        { error: "Gagal menjalankan rollover (tidak ada yang berubah)" },
        { status: 500 }
      );
    }

    const ringkasan = {
      coCount: hasil.coCount,
      flipCount: hasil.flipCount,
      riwayatBaru: hasil.riwayatBaru,
      mutasiCount: hasil.mutasiCount,
      santriAktif: hasil.santriAktif,
    };
    await prisma.rolloverLog
      .update({
        where: { idempotencyKey },
        data: { status: "OK", finishedAt: new Date(), summary: ringkasan },
      })
      .catch(() => undefined);

    // --- Webhook ke Siakad SETELAH komit, tanpa menunggu (sync Siakad
    // lambat). Gagal webhook TIDAK membatalkan rollover; Bawwabah
    // memverifikasi sendiri dan menyediakan tombol Kirim Ulang. ---
    notifySiakadWebhook().catch((err) =>
      console.error("Webhook Siakad pasca-rollover gagal:", err)
    );

    return NextResponse.json({
      ok: true,
      sudahDilakukan: false,
      dufahId: hasil.dufahId,
      namaDufah: hasil.namaDufah,
      ...ringkasan,
      webhook: "pending",
    });
  } catch (e) {
    console.error("POST /api/bawwabah/rollover gagal:", e);
    return NextResponse.json({ error: "Gagal memproses rollover" }, { status: 500 });
  }
}
