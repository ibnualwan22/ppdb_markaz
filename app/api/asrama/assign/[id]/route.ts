import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ID dari tabel RiwayatDufah bulan ini
    const body = await request.json();
    const { lemariId } = body;

    if (!lemariId) {
      return NextResponse.json({ error: "Pilihan lemari wajib diisi" }, { status: 400 });
    }

    // 1. Cari data riwayat pendaftaran bulan ini untuk mendapatkan santriId
    const dataBulanIni = await prisma.riwayatDufah.findUnique({
      where: { id: id },
      include: { santri: true }
    });

    if (!dataBulanIni) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    // ==========================================
    // LOGIKA BARU: VALIDASI ROLLING (BLOKIR KAMAR LAMA)
    // ==========================================

    // 2. Ambil tepat 1 riwayat kamar terakhir di bulan sebelumnya
    const riwayatBulanLalu = await prisma.riwayatDufah.findFirst({
      where: { 
        santriId: dataBulanIni.santriId, 
        dufahId: { lt: dataBulanIni.dufahId } // Cari dufah sebelum bulan ini
      },
      orderBy: { dufahId: 'desc' }
    });

    // 3. Jika panitia memilih lemari yang SAMA PERSIS dengan bulan lalu
    if (riwayatBulanLalu && riwayatBulanLalu.lemariId === lemariId) {
      return NextResponse.json({ 
        error: `SISTEM MENOLAK: ${dataBulanIni.santri.nama} baru saja menempati lemari ini dan wajib pindah sakan/kamar. Silakan pilih lokasi lain.` 
      }, { status: 403 }); // 403 = Forbidden
    }

    // ==========================================

    // 4. Jika lolos validasi, lakukan Update
    const updatePenempatan = await prisma.riwayatDufah.update({
      where: { id: id },
      data: {
        lemariId: lemariId,
        status: "ASSIGNED",
      },
      include: {
        santri: { select: { nama: true } },
        lemari: { include: { kamar: { include: { sakan: true } } } }
      }
    });

    const namaSakan = updatePenempatan.lemari?.kamar.sakan.nama;
    emitDataUpdate("assign");
    
    await sendGlobalNotification(
      "Kamar Telah Diplot 🛏️",
      `Santri a.n ${updatePenempatan.santri.nama} telah ditempatkan di ${namaSakan}. ID Card siap dicetak.`,
      "receive_notif_plot_asrama",
      "/admin/id-card"
    );

    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    const pelaku = u ? `${u.name} (@${u.username})` : "Admin";

    await logActivity({
      aksi: "UPDATE",
      modul: "Asrama",
      deskripsi: `Menempatkan santri a.n ${updatePenempatan.santri.nama} ke ${namaSakan} — Kamar ${updatePenempatan.lemari?.kamar.nama} — Lemari ${updatePenempatan.lemari?.nomor}`,
      namaUser: pelaku,
      userId: u?.id,
      targetId: updatePenempatan.santriId,
    });

    return NextResponse.json({ 
      message: `Berhasil! ${updatePenempatan.santri.nama} menempati sakan baru di ${namaSakan}.`,
      data: updatePenempatan 
    });

  } catch (error) {
    return NextResponse.json({ error: "Gagal memproses penempatan kamar" }, { status: 500 });
  }
}