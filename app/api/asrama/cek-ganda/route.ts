import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/asrama/cek-ganda
 * Mendeteksi lemari yang dihuni lebih dari 1 santri pada dufah aktif.
 * (Deteksi, bukan pencegahan — admin yang membereskan manual.)
 */
export async function GET() {
  try {
    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json([]);

    const penghuni = await prisma.riwayatDufah.findMany({
      where: {
        dufahId: dufahAktif.id,
        lemariId: { not: null },
        status: { not: "CHECKED_OUT" },
      },
      select: {
        lemariId: true,
        santri: { select: { id: true, nama: true } },
        lemari: {
          select: {
            id: true,
            nomor: true,
            kamar: {
              select: {
                id: true,
                nama: true,
                sakan: { select: { id: true, nama: true } },
              },
            },
          },
        },
      },
      orderBy: { santri: { nama: "asc" } },
    });

    const perLemari = new Map<string, any>();
    for (const p of penghuni) {
      if (!p.lemariId || !p.lemari) continue;
      const cur = perLemari.get(p.lemariId) || { lemari: p.lemari, penghuni: [] };
      cur.penghuni.push(p.santri);
      perLemari.set(p.lemariId, cur);
    }

    const konflik = [...perLemari.values()].filter((x) => x.penghuni.length > 1);
    return NextResponse.json(konflik);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memeriksa kamar ganda" }, { status: 500 });
  }
}
