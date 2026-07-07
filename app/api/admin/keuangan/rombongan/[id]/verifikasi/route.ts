import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendGlobalNotification, emitDataUpdate, logActivity } from "@/app/lib/pusherServer";

async function generateNIS(tx: any, dufah: any, tanggalLahir: Date) {
  const dufahNumberMatch = dufah.nama.match(/\d+/);
  const rawPrefix = dufahNumberMatch ? dufahNumberMatch[0] : dufah.id.toString();
  const dufahPrefix = rawPrefix.padStart(2, '0');
  
  const dd = tanggalLahir.getDate().toString().padStart(2, '0');
  const mm = (tanggalLahir.getMonth() + 1).toString().padStart(2, '0');
  const yy = tanggalLahir.getFullYear().toString().slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  
  const santris = await tx.santri.findMany({
    where: { nis: { startsWith: dufahPrefix } },
    select: { nis: true }
  });

  let maxUrut = 0;
  for (const s of santris) {
    if (s.nis && s.nis.length >= 3) {
      const urutStr = s.nis.slice(-3);
      const urutVal = parseInt(urutStr, 10);
      if (!isNaN(urutVal) && urutVal > maxUrut) {
        maxUrut = urutVal;
      }
    }
  }

  const urut = maxUrut + 1;
  return `${dufahPrefix}${dateStr}${urut.toString().padStart(3, '0')}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID wajib diisi" }, { status: 400 });
    }

    const adminExists = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminExists) {
      return NextResponse.json({ error: "Sesi tidak valid (User Admin tidak ditemukan)." }, { status: 401 });
    }

    const rombongan = await prisma.rombongan.findUnique({
      where: { id },
      include: {
        transaksi: {
          include: {
            santri: true,
            program: true
          }
        },
        dufahTujuan: true
      }
    });

    if (!rombongan || rombongan.statusPembayaran !== "PENDING") {
      return NextResponse.json({ error: "Rombongan tidak ditemukan atau sudah diproses" }, { status: 400 });
    }

    const dufahAktif = await prisma.dufah.findFirst({ where: { isActive: true } });
    if (!dufahAktif) {
      return NextResponse.json({ error: "Tidak ada Duf'ah aktif" }, { status: 400 });
    }

    const targetDufahId = rombongan.dufahTujuanId || dufahAktif.id;
    const targetDufahObj = rombongan.dufahTujuan || dufahAktif;

    const result = await prisma.$transaction(async (tx) => {
      // Update Rombongan Status
      await tx.rombongan.update({
        where: { id },
        data: {
          statusPembayaran: "PAID",
          diverifikasiOleh: adminId,
          waktuLunas: new Date()
        }
      });

      // Process each transaction
      for (const transaksi of rombongan.transaksi) {
        // Update Transaksi Status
        await tx.transaksiPendaftaran.update({
          where: { id: transaksi.id },
          data: {
            statusPembayaran: "PAID",
            diverifikasiOleh: adminId,
            waktuLunas: new Date()
          }
        });

        // Generate NIS
        let nis = transaksi.santri.nis;
        if (!nis && transaksi.santri.tanggalLahir) {
          nis = await generateNIS(tx, targetDufahObj, new Date(transaksi.santri.tanggalLahir));
        }

        // Kalkulasi Batas Aktif Duf'ah
        const santriDb = await tx.santri.findUnique({ where: { id: transaksi.santriId } });
        const currentBatas = santriDb?.batasAktifDufah || 0;
        
        const startDufah = currentBatas < targetDufahId ? targetDufahId : currentBatas + 1;
        const newBatasAktif = startDufah + transaksi.program.durasiBulan - 1;

        const isBeliAtribut = transaksi.nominalProgram >= transaksi.program.harga;

        const cekRiwayat = await tx.riwayatDufah.findUnique({
          where: {
            santriId_dufahId: { santriId: transaksi.santriId, dufahId: targetDufahId }
          }
        });

        let newBulanKe = 1;
        let previousLemariId = null;
        let kategoriBaru = santriDb?.kategori || "BARU";

        if (!cekRiwayat) {
          const lastRiwayatEver = await tx.riwayatDufah.findFirst({
            where: { santriId: transaksi.santriId },
            orderBy: { dufahId: 'desc' }
          });

          if (lastRiwayatEver) {
            const previousDufah = await tx.dufah.findFirst({
              where: { id: { lt: targetDufahId } },
              orderBy: { id: 'desc' }
            });

            if (previousDufah && lastRiwayatEver.dufahId === previousDufah.id) {
              // TIDAK TERPUTUS
              const batasMaksimal = 3;
              const durasiBerjalan = lastRiwayatEver.bulanKe || 1;
              if (durasiBerjalan % batasMaksimal !== 0) {
                 previousLemariId = lastRiwayatEver.lemariId;
                 newBulanKe = durasiBerjalan + 1;
              } else {
                 previousLemariId = null;
                 newBulanKe = durasiBerjalan + 1;
              }
            } else {
              // TERPUTUS! (Bolong Duf'ah)
              previousLemariId = null;
              newBulanKe = 1;
              kategoriBaru = "BARU";
            }
          }

          // Update Santri dengan kategori yang sudah disesuaikan
          await tx.santri.update({
            where: { id: transaksi.santriId },
            data: {
              nis,
              batasAktifDufah: newBatasAktif,
              isAktif: true,
              kategori: kategoriBaru,
              programId: transaksi.programId
            }
          });

          await tx.riwayatDufah.create({
            data: {
              santriId: transaksi.santriId,
              dufahId: targetDufahId,
              lemariId: previousLemariId,
              status: previousLemariId ? "ASSIGNED" : "PRE_LIST",
              bulanKe: newBulanKe,
              isLunas: true,
              isIdCardTaken: false,
              isDresscodeTaken: !isBeliAtribut,
              isToteBagTaken: !isBeliAtribut,
              isPinTaken: !isBeliAtribut,
              isSongkokKhimarTaken: !isBeliAtribut,
              isMalzamahTaken: false,
              isTabirotTaken: false
            }
          });
        } else {
          // Jika riwayat sudah ada, update Lunas
          await tx.santri.update({
            where: { id: transaksi.santriId },
            data: {
              nis,
              batasAktifDufah: newBatasAktif,
              isAktif: true,
              kategori: kategoriBaru,
              programId: transaksi.programId
            }
          });

          await tx.riwayatDufah.update({
            where: { id: cekRiwayat.id },
            data: {
              isLunas: true,
              ...(isBeliAtribut ? {
                isDresscodeTaken: false,
                isToteBagTaken: false,
                isPinTaken: false,
                isSongkokKhimarTaken: false,
                isMalzamahTaken: false,
                isTabirotTaken: false
              } : {})
            }
          });
        }
      }

      return rombongan;
    });

    emitDataUpdate("pendaftaran-verified");
    emitDataUpdate("mimstore");
    emitDataUpdate("id-card");

    await sendGlobalNotification(
      "Pembayaran Rombongan Lunas 💰",
      `Rombongan ${rombongan.nama} telah diverifikasi lunas. ${rombongan.transaksi.length} santri siap untuk plot asrama.`,
      "receive_notif_plot_asrama",
      "/admin/asrama"
    );

    const pelaku = adminExists ? `${adminExists.nama} (@${adminExists.username})` : "Admin";

    await logActivity({
      aksi: "VERIFY",
      modul: "Keuangan",
      deskripsi: `Memverifikasi pembayaran rombongan ${rombongan.nama} (${rombongan.transaksi.length} santri) — Total: Rp ${new Intl.NumberFormat('id-ID').format(rombongan.totalTagihan)}`,
      namaUser: pelaku,
      userId: adminId,
      targetId: rombongan.id,
    });

    return NextResponse.json({
      message: "Verifikasi berhasil. Santri telah masuk antrean asrama.",
      data: result
    });

  } catch (error: any) {
    console.error("Error Verifikasi Rombongan:", error);
    return NextResponse.json({ error: "Gagal memverifikasi", details: error.message }, { status: 500 });
  }
}
