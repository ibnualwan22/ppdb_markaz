import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";

/**
 * POST /api/bawwabah/dufah — endpoint khusus Bawwabah (rancangan
 * PPDB-pendaftaran, 6 Nov 2026).
 *
 * Bawwabah memanggil ini SEKALI per draf saat super admin membuat draf
 * periode di /periode — BUKAN saat aktivasi (pendaftaran dibuka jauh
 * sebelum aktivasi; lih. Duf'ah 95: pendaftaran buka 15 Okt, aktivasi
 * 6 Nov). Baris Dufah dibuat dengan isActive=false; yang mengaktifkan
 * periode tetap hanya rollover (POST /api/bawwabah/rollover).
 *
 * Auth: header `x-bawwabah-key` == env BAWABAH_API_KEY (pola yang sama
 * dengan endpoint rollover Fase 7). Tanpa key -> 401.
 *
 * Body: { bawwabahPeriodId, nama, tanggalBuka, tanggalTutup, isTahunBaru }
 *   - bawwabahPeriodId: id periode Bawwabah (p-<cuid>), kunci idempotensi.
 *   - nama: nama dufah dari draf Bawwabah.
 *   - tanggalBuka/tanggalTutup: ISO datetime dari draf Bawwabah (jendela
 *     pendaftaran — saklar "aktifkan pendaftaran" di PPDB).
 *   - isTahunBaru: flag tahun baru dari draf Bawwabah.
 *
 * Idempotensi: bawwabahPeriodId yang sama mengembalikan baris yang sudah
 * ada (200, sudahAda: true) tanpa membuat duplikat. Nama yang sudah
 * dipakai baris lain ditolak 409 (jangan membuat dua baris bernama sama).
 *
 * Respons sukses: { ok, sudahAda, dufahId, nama, webhook }
 *   - webhook: "pending" — pengumuman ke Siakad dikirim tanpa menunggu
 *     (sync Siakad lambat); baris dufah baru ikut tersinkron pada sync
 *     berikutnya.
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

  const bawwabahPeriodId =
    typeof body.bawwabahPeriodId === "string" ? body.bawwabahPeriodId : "";
  const nama = typeof body.nama === "string" ? body.nama : "";
  const tanggalBuka = typeof body.tanggalBuka === "string" ? body.tanggalBuka : "";
  const tanggalTutup =
    typeof body.tanggalTutup === "string" ? body.tanggalTutup : "";
  const isTahunBaru = body.isTahunBaru === true;

  if (!bawwabahPeriodId.trim()) {
    return NextResponse.json(
      { error: "bawwabahPeriodId wajib diisi" },
      { status: 400 }
    );
  }
  if (!nama.trim()) {
    return NextResponse.json({ error: "nama wajib diisi" }, { status: 400 });
  }
  if (!tanggalBuka.trim() || Number.isNaN(Date.parse(tanggalBuka))) {
    return NextResponse.json(
      { error: "tanggalBuka tidak valid" },
      { status: 400 }
    );
  }
  if (!tanggalTutup.trim() || Number.isNaN(Date.parse(tanggalTutup))) {
    return NextResponse.json(
      { error: "tanggalTutup tidak valid" },
      { status: 400 }
    );
  }
  if (Date.parse(tanggalTutup) <= Date.parse(tanggalBuka)) {
    return NextResponse.json(
      { error: "tanggalTutup harus sesudah tanggalBuka" },
      { status: 400 }
    );
  }

  try {
    // --- Idempotensi: periode Bawwabah yang sama tidak boleh membuat
    // baris kedua. ---
    const sudahAda = await prisma.dufah.findUnique({
      where: { bawwabahPeriodId: bawwabahPeriodId.trim() },
    });
    if (sudahAda) {
      return NextResponse.json({
        ok: true,
        sudahAda: true,
        dufahId: sudahAda.id,
        nama: sudahAda.nama,
        webhook: "pending",
      });
    }

    // --- Nama tidak boleh bentrok dengan baris lain. ---
    const bentrokNama = await prisma.dufah.findFirst({
      where: { nama: nama.trim() },
    });
    if (bentrokNama) {
      return NextResponse.json(
        {
          error: `Nama "${nama.trim()}" sudah dipakai baris Dufah id ${bentrokNama.id}`,
        },
        { status: 409 }
      );
    }

    // --- Buat baris (isActive=false — aktivasi tetap lewat rollover). ---
    let dibuat;
    try {
      dibuat = await prisma.dufah.create({
        data: {
          nama: nama.trim(),
          isActive: false,
          isTahunBaru,
          tanggalBuka: new Date(tanggalBuka),
          tanggalTutup: new Date(tanggalTutup),
          bawwabahPeriodId: bawwabahPeriodId.trim(),
        },
      });
    } catch (e) {
      // Balapan dengan panggilan lain yang memakai kunci sama (UNIQUE).
      const sudahAdaLagi = await prisma.dufah
        .findUnique({
          where: { bawwabahPeriodId: bawwabahPeriodId.trim() },
        })
        .catch(() => null);
      if (sudahAdaLagi) {
        return NextResponse.json({
          ok: true,
          sudahAda: true,
          dufahId: sudahAdaLagi.id,
          nama: sudahAdaLagi.nama,
          webhook: "pending",
        });
      }
      throw e;
    }

    // --- Webhook ke Siakad SETELAH komit, tanpa menunggu. Gagal webhook
    // TIDAK membatalkan pembuatan baris; baris baru ikut tersinkron pada
    // sync berikutnya. ---
    notifySiakadWebhook().catch((err) =>
      console.error("Webhook Siakad pasca-buat-dufah gagal:", err)
    );

    return NextResponse.json(
      {
        ok: true,
        sudahAda: false,
        dufahId: dibuat.id,
        nama: dibuat.nama,
        webhook: "pending",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/bawwabah/dufah gagal:", e);
    return NextResponse.json(
      { error: "Gagal membuat baris Dufah" },
      { status: 500 }
    );
  }
}
