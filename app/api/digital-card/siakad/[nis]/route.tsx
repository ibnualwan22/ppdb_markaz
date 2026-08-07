import prisma from "@/lib/prisma";
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET(request: Request, context: { params: Promise<{ nis: string }> }) {
  try {
    const { nis } = await context.params;
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === '1';

    // 1. Dapatkan santri berdasarkan NIS
    const santriModel = await prisma.santri.findUnique({
      where: { nis },
    });

    if (!santriModel) {
      return new Response('Data Santri tidak ditemukan', { status: 404 });
    }

    // 2. Dapatkan riwayat aktif untuk santri tersebut
    const riwayat = await prisma.riwayatDufah.findFirst({
      where: { 
        santriId: santriModel.id, 
        dufah: { isActive: true } 
      },
      include: {
        santri: true,
        dufah: true,
        lemari: { include: { kamar: { include: { sakan: true } } } },
      },
    });

    if (!riwayat) {
      return new Response('Tidak ada riwayat asrama aktif untuk santri ini', { status: 404 });
    }

    const { santri, lemari, dufah } = riwayat;
    const lokasi = lemari
      ? `${lemari.kamar.sakan.nama} • Kamar ${lemari.kamar.nama} • Lemari ${lemari.nomor}`
      : 'Belum dapat lemari';

    // 3. Load background image dari public directory
    let bgDataUrl: string | null = null;
    try {
      const bgPath = path.join(process.cwd(), 'public', 'images', 'id-card.png');
      const bgBuffer = readFileSync(bgPath);
      bgDataUrl = `data:image/png;base64,${bgBuffer.toString('base64')}`;
    } catch (e) {
      console.error('Failed to load id-card.png', e);
    }

    // 4. Generate Image
    const res = new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0A0A',
            fontFamily: 'Georgia, serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {bgDataUrl && (
            <img
              src={bgDataUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* ── Main content overlay ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
            }}
          >
            {/* NAMA SANTRI */}
            <div style={{ position: 'absolute', top: '190px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <span style={{ color: '#000000', fontSize: '56px', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.1 }}>
                {santri.nama}
              </span>
            </div>

            {/* NIS */}
            <div style={{ position: 'absolute', top: '313px', left: '197px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>
                {santri.nis || '—'}
              </span>
            </div>

            {/* DUFAH */}
            <div style={{ position: 'absolute', top: '313px', right: '223px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>
                {dufah.nama}
              </span>
            </div>

            {/* LOKASI ASRAMA */}
            <div style={{ position: 'absolute', top: '410px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <span style={{ color: '#000000', fontSize: '26px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '1px' }}>
                {lokasi}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 900,
        height: 560,
      }
    );

    // 5. Tambahkan header untuk CORS & Attachment jika diperlukan
    res.headers.set('Access-Control-Allow-Origin', '*');
    if (isDownload) {
      res.headers.set('Content-Disposition', `attachment; filename="Kartu_Santri_${nis}.png"`);
    }

    return res;

  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
