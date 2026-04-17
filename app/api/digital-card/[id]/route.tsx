import { ImageResponse } from 'next/og';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

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

    // Load logo from public directory as base64
    let logoDataUrl: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      const logoBuffer = readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch {
      // Logo not found, render without it
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
          {/* ── Decorative corner ornaments ── */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', display: 'flex' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M0 0 L80 0 L80 4 L4 4 L4 80 L0 80 Z" fill="#D4AF37" />
              <path d="M0 0 L50 0 L50 2 L2 2 L2 50 L0 50 Z" fill="#B8963E" opacity="0.5" />
              <circle cx="6" cy="6" r="3" fill="#D4AF37" />
            </svg>
          </div>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', display: 'flex' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M120 0 L40 0 L40 4 L116 4 L116 80 L120 80 Z" fill="#D4AF37" />
              <path d="M120 0 L70 0 L70 2 L118 2 L118 50 L120 50 Z" fill="#B8963E" opacity="0.5" />
              <circle cx="114" cy="6" r="3" fill="#D4AF37" />
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '120px', height: '120px', display: 'flex' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M0 120 L80 120 L80 116 L4 116 L4 40 L0 40 Z" fill="#D4AF37" />
              <path d="M0 120 L50 120 L50 118 L2 118 L2 70 L0 70 Z" fill="#B8963E" opacity="0.5" />
              <circle cx="6" cy="114" r="3" fill="#D4AF37" />
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px', display: 'flex' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path d="M120 120 L40 120 L40 116 L116 116 L116 40 L120 40 Z" fill="#D4AF37" />
              <path d="M120 120 L70 120 L70 118 L118 118 L118 70 L120 70 Z" fill="#B8963E" opacity="0.5" />
              <circle cx="114" cy="114" r="3" fill="#D4AF37" />
            </svg>
          </div>

          {/* ── Subtle gold shimmer gradient overlay ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08) 0%, transparent 65%)',
              display: 'flex',
            }}
          />

          {/* ── Main content ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              padding: '36px 60px 28px',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                width: '100%',
              }}
            >
              {logoDataUrl && (
                <img
                  src={logoDataUrl}
                  width={72}
                  height={72}
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.5))' }}
                />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: logoDataUrl ? 'flex-start' : 'center' }}>
                <span
                  style={{
                    color: '#D4AF37',
                    fontSize: '34px',
                    fontWeight: 'bold',
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    lineHeight: 1,
                  }}
                >
                  PPDB MARKAZ
                </span>
                <span
                  style={{
                    color: '#7A6A3A',
                    fontSize: '13px',
                    letterSpacing: '5px',
                    marginTop: '6px',
                    textTransform: 'uppercase',
                  }}
                >
                  KARTU SANTRI DIGITAL
                </span>
              </div>
            </div>

            {/* Gold divider with diamond */}
            <div style={{ display: 'flex', alignItems: 'center', width: '85%', gap: '12px', margin: '-4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, #D4AF37)' }} />
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" fill="#D4AF37" />
              </svg>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, #D4AF37)' }} />
            </div>

            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#5A4A2A', fontSize: '13px', letterSpacing: '4px', textTransform: 'uppercase' }}>
                Nama Santri
              </span>
              <span
                style={{
                  color: '#F5F0E8',
                  fontSize: '48px',
                  fontWeight: '800',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  lineHeight: 1.1,
                  textShadow: '0 2px 20px rgba(212,175,55,0.2)',
                }}
              >
                {santri.nama}
              </span>
            </div>

            {/* Info badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {/* NIS */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  gap: '4px',
                }}
              >
                <span style={{ color: '#7A6A3A', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                  NIS
                </span>
                <span style={{ color: '#D4AF37', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  {santri.nis || '—'}
                </span>
              </div>

              {/* Vertical separator */}
              <div
                style={{
                  width: '1px',
                  height: '50px',
                  background: 'linear-gradient(to bottom, transparent, #D4AF37, transparent)',
                }}
              />

              {/* Gender */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  backgroundColor: 'rgba(212,175,55,0.06)',
                  border: '1px solid rgba(212,175,55,0.25)',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  gap: '4px',
                }}
              >
                <span style={{ color: '#7A6A3A', fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase' }}>
                  Dufah
                </span>
                <span style={{ color: '#D4AF37', fontSize: '26px', fontWeight: 'bold', letterSpacing: '2px' }}>
                  {dufah.nama}
                </span>
              </div>
            </div>

            {/* Location banner */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,150,62,0.06) 100%)',
                border: '1px solid rgba(212,175,55,0.3)',
                borderRadius: '12px',
                padding: '14px 36px',
                gap: '5px',
                width: '75%',
              }}
            >
              <span style={{ color: '#7A6A3A', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase' }}>
                Lokasi Asrama / Lemari
              </span>
              <span style={{ color: '#E8DFC0', fontSize: '22px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '1px' }}>
                {lokasi}
              </span>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '1px', backgroundColor: 'rgba(212,175,55,0.3)' }} />
                <span style={{ color: '#4A3A1A', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Harap tunjukkan kartu ini untuk pengambilan atribut di Mims Store dan saat Tauzi' Fushul
                </span>
                <div style={{ width: '30px', height: '1px', backgroundColor: 'rgba(212,175,55,0.3)' }} />
              </div>
              <span style={{ color: '#3A2A0A', fontSize: '10px', letterSpacing: '1px' }}>
                © {new Date().getFullYear()} PPDB MARKAZ — Dokumen Resmi
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