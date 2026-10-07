import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { emitDataUpdate, logActivity } from "@/app/lib/pusherServer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifySiakadWebhook } from "@/app/lib/webhook-siakad";
import { cekWajibMutasiSakan } from "@/app/lib/mutasi-sakan";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { lemariIdBaru } = body;

    if (!lemariIdBaru) return NextResponse.json({ error: "Lemari tujuan kosong" }, { status: 400 });

    // Cari data riwayat yang akan dipindah
    const dataRiwayat = await prisma.riwayatDufah.findUnique({
      where: { id },
      include: { santri: true }
    });

    if (!dataRiwayat) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    // Cek detail lemari tujuan untuk mengetahui sakanId-nya
    const targetLemari = await prisma.lemari.findUnique({
      where: { id: lemariIdBaru },
      include: { kamar: { include: { sakan: true } } }
    });

    if (!targetLemari) return NextResponse.json({ error: "Lemari tujuan tidak valid" }, { status: 400 });

    // ==========================================
    // VALIDASI ATURAN MUTASI 3 DUFAH (sama seperti API assign)
    // Menutup bypass: "Pindah Kamar" tidak boleh menaruh santri kembali
    // ke sakan yang sama setelah 3 dufah berturut-turut.
    // ==========================================
    if (dataRiwayat.santri.kategori !== "KSU") {
      const hasil = await cekWajibMutasiSakan(dataRiwayat.santriId, dataRiwayat.dufahId);
      if (hasil.wajibMutasi && hasil.sakanIdLama === targetLemari.kamar.sakanId) {
        return NextResponse.json({
          error: `SISTEM MENOLAK: ${dataRiwayat.santri.nama} telah menetap di Sakan ${hasil.namaSakanLama} selama 3 dufah berturut-turut. Aturan mutasi mewajibkan santri pindah ke Sakan/Gedung lain, bukan sekadar pindah kamar/lemari di sakan yang sama.`
        }, { status: 403 });
      }
    }
    // ==========================================

    const update = await prisma.riwayatDufah.update({
      where: { id },
      data: { lemariId: lemariIdBaru, status: "ASSIGNED" }
    });

    await prisma.lemari.update({
      where: { id: lemariIdBaru },
      data: { isPriority: false }
    });

    // Catat aktivitas agar perpindahan bisa ditelusuri (sebelumnya tidak ada log)
    const session = await getServerSession(authOptions);
    const u = session?.user as any;
    const pelaku = u ? `${u.name} (@${u.username})` : "Admin";
    await logActivity({
      aksi: "UPDATE",
      modul: "Asrama",
      deskripsi: `Pindah kamar santri a.n ${dataRiwayat.santri.nama} ke ${targetLemari.kamar.sakan.nama} — Kamar ${targetLemari.kamar.nama} — Lemari ${targetLemari.nomor}`,
      namaUser: pelaku,
      userId: u?.id,
      targetId: dataRiwayat.santriId,
    });

    emitDataUpdate("pindah-kamar");
    await notifySiakadWebhook();
    return NextResponse.json({ message: "Santri berhasil dipindahkan!", data: update });
  } catch (error) {
    return NextResponse.json({ error: "Gagal memindahkan santri" }, { status: 500 });
  }
}
