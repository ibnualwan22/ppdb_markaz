import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, emitNotification } from "@/app/lib/pusherServer";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, lemariId, kategori, bulanKe, gender } = body; 

    if (!nama || !lemariId || !kategori) {
      return NextResponse.json({ error: "Nama, Kategori, dan Lemari wajib diisi" }, { status: 400 });
    }

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) return NextResponse.json({ error: "Tidak ada Duf'ah yang aktif." }, { status: 400 });

    const cekLemari = await prisma.riwayatDufah.findFirst({
      where: { lemariId: lemariId, dufahId: dufahAktif.id }
    });
    if (cekLemari) return NextResponse.json({ error: "Gagal: Lemari ini sudah terisi!" }, { status: 400 });

    const santriBaru = await prisma.santri.create({
      data: {
        nama: nama,
        kategori: kategori,
        gender: gender || "BANIN",
        isAktif: true,
        riwayat: {
          create: {
            dufahId: dufahAktif.id,
            lemariId: lemariId,
            status: "ASSIGNED",
            
            // ==========================================
            // SOLUSI: BYPASS MEJA ID CARD KHUSUS KSU
            // ==========================================
            isIdCardTaken: kategori === "KSU" ? true : false, 
            
            bulanKe: kategori === "LAMA" ? parseInt(bulanKe) : 1
          }
        }
      },
      include: { riwayat: true }
    });

    emitDataUpdate("santri-baru");
    emitNotification("asrama", `🛏️ ${nama} telah ditempatkan ke kamar baru`, { nama, kategori });

    return NextResponse.json({
      message: `${nama} berhasil didata. ${kategori === "KSU" ? "(KSU otomatis Bypass ID Card)" : ""}`,
      data: santriBaru
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan data ke asrama" }, { status: 500 });
  }
}