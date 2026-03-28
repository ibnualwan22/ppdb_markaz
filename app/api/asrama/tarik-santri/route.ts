import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitNotification } from "../../../lib/pusherServer";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { santriId } = body;

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ error: "Tidak ada Duf'ah aktif bulan ini." }, { status: 403 });

    const dataSantri = await prisma.santri.findUnique({ where: { id: santriId } });
    if (!dataSantri) return NextResponse.json({ error: "Santri tidak ditemukan" }, { status: 404 });
    if (dataSantri.isAktif) return NextResponse.json({ error: "Santri tersebut berstatus aktif!" }, { status: 400 });

    // 1. Activate student and reset their category to BARU because they are returning
    await prisma.santri.update({
      where: { id: santriId },
      data: {
        isAktif: true,
        kategori: "BARU", 
      }
    });

    // 2. Put them in the rolling queue by creating the RiwayatDufah for the active dufah with lemariId: null
    const existing = await prisma.riwayatDufah.findUnique({
      where: { santriId_dufahId: { santriId: santriId, dufahId: dufahAktif.id } }
    });

    if (!existing) {
      await prisma.riwayatDufah.create({
        data: {
          santriId: santriId,
          dufahId: dufahAktif.id,
          lemariId: null, // explicitly needed for PRE_LIST in Meja Asrama
          status: "PRE_LIST",
          isIdCardTaken: false,
          bulanKe: 1,
        }
      });
    } else {
       // if there's already existing but lemariId was assigned, we force it to null to queue them
       await prisma.riwayatDufah.update({
          where: { id: existing.id },
          data: {
             lemariId: null,
             status: "PRE_LIST",
             bulanKe: 1
          }
       })
    }

    emitNotification("asrama", `🔄 ${dataSantri.nama} (${dataSantri.gender}) ditarik kembali & masuk antrean kamar!`, { nama: dataSantri.nama });

    return NextResponse.json({ message: "Berhasil ditarik & masuk antrean" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menarik santri" }, { status: 500 });
  }
}
