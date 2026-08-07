import { getSessionDariSiakad } from '@/app/lib/auth-santri';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
   try {
      const session = await getSessionDariSiakad();
      if (!session || !session.santriId) {
         return NextResponse.json({ session: null });
      }

      const santriId = session.santriId as string;
      
      const santri = await prisma.santri.findUnique({
         where: { id: santriId },
      });

      if (!santri) {
         return NextResponse.json({ session: null, error: "Data Santri tidak ditemukan di database" });
      }

      // Format return sesuai dengan response dari /api/pendaftaran/cek
      const santriData = {
         id: santri.id,
         nama: santri.nama,
         nis: santri.nis,
         gender: santri.gender,
         tempatLahir: santri.tempatLahir,
         tanggalLahir: santri.tanggalLahir,
         noWaOrtu: santri.noWaOrtu,
         detailAlamat: santri.detailAlamat,
         kategori: santri.kategori,
         isAktif: santri.isAktif,
         batasAktifDufah: santri.batasAktifDufah
      };

      return NextResponse.json({ session, santriData });
   } catch (error) {
      console.error("Error validasi session Siakad:", error);
      return NextResponse.json({ session: null, error: "Gagal memverifikasi session" }, { status: 500 });
   }
}
