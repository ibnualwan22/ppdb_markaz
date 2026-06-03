import prisma from "@/lib/prisma";
import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import path from 'path';


export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;

    const riwayat = await prisma.riwayatDufah.findUnique({
      where: { id: params.id },
      include: {
        santri: true,
        dufah: true,
        lemari: { include: { kamar: { include: { sakan: true } } } },
      },
    });

    if (!riwayat) {
      return new Response('Not found', { status: 404 });
    }

    const { santri, lemari, dufah } = riwayat;
    const lokasi = lemari
      ? `${lemari.kamar.sakan.nama} • Kamar ${lemari.kamar.nama} • Lemari ${lemari.nomor}`
      : 'Belum dapat lemari';

    // Load background image from public directory
    let bgDataUrl: string | null = null;
    try {
      const bgPath = path.join(process.cwd(), 'public', 'images', 'id-card.png');
      const bgBuffer = readFileSync(bgPath);
      bgDataUrl = `data:image/png;base64,${bgBuffer.toString('base64')}`;
    } catch (e) {
      console.error('Failed to load id-card.png', e);
    }

    return new ImageResponse(
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

          {/* ── Main content overlay (ABSOLUTE POSITIONING) ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
            }}
          >
            {/* 1. NAMA SANTRI */}
            {/* Ubah nilai 'top' untuk naik/turun */}
            <div style={{ position: 'absolute', top: '190px', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <span style={{ color: '#000000', fontSize: '56px', fontWeight: '800', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', lineHeight: 1.1 }}>
                {santri.nama}
              </span>
            </div>

            {/* 2. NIS */}
            {/* Ubah 'top' untuk naik/turun, ubah 'left' untuk kanan/kiri */}
            <div style={{ position: 'absolute', top: '313px', left: '197px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>
                {santri.nis || '—'}
              </span>
            </div>

            {/* 3. DUFAH */}
            {/* Ubah 'top' untuk naik/turun, ubah 'right' untuk kanan/kiri */}
            <div style={{ position: 'absolute', top: '313px', right: '223px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#000000', fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>
                {dufah.nama}
              </span>
            </div>

            {/* 4. LOKASI ASRAMA */}
            {/* Ubah nilai 'top' untuk naik/turun */}
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
  } catch (e: any) {
    console.error('OG Image generation error:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}