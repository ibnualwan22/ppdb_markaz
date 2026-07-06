import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, sendGlobalNotification, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";


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

    // Cek detail lemari yang dipilih panitia untuk mengetahui sakanId-nya
    const targetLemari = await prisma.lemari.findUnique({
      where: { id: lemariId },
      include: { kamar: { include: { sakan: true } } }
    });

    if (!targetLemari) return NextResponse.json({ error: "Lemari tujuan tidak valid" }, { status: 400 });

    // ==========================================
    // LOGIKA BARU: VALIDASI ROLLING BUKAN LAGI %3, TAPI CEK SAKAN
    // ==========================================

    // Cek 3 riwayat terakhir sebelum target assignment ini
    const riwayat3 = await prisma.riwayatDufah.findMany({
      where: { 
        santriId: dataBulanIni.santriId, 
        lemariId: { not: null },
        dufahId: { lt: dataBulanIni.dufahId } 
      },
      orderBy: { dufahId: 'desc' },
      take: 3,
      include: { lemari: { include: { kamar: { include: { sakan: true } } } } }
    });

    const sakanIdList = riwayat3.map(r => r.lemari?.kamar.sakanId).filter(Boolean);
    const allSame = sakanIdList.length >= 3 && sakanIdList.every(id => id === sakanIdList[0]);

    // 3. Validasi aturan mutasi 3 bulan: selain KSU, wajib pindah ke Sakan/Gedung yang berbeda
    if (dataBulanIni.santri.kategori !== "KSU" && allSame) {
      const sakanLamaId = sakanIdList[0];
      const sakanBaruId = targetLemari.kamar.sakanId;

      if (sakanLamaId === sakanBaruId) {
        const namaSakanLalu = riwayat3[0].lemari?.kamar.sakan.nama;
        return NextResponse.json({ 
          error: `SISTEM MENOLAK: ${dataBulanIni.santri.nama} telah menetap di Sakan ${namaSakanLalu} selama 3 bulan/dufah berturut-turut. Aturan mutasi mewajibkan santri pindah ke Sakan/Gedung lain, bukan sekadar pindah kamar/lemari di sakan yang sama.` 
        }, { status: 403 });
      }
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

    await prisma.lemari.update({
      where: { id: lemariId },
      data: { isPriority: false }
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