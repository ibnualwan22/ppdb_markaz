import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Sesuaikan dengan yang ada di .env PPDB
const secretKey = process.env.JWT_SECRET || 'markaz-arabiyah-siakad-secret-key-super-secure-2026-!@#$';
const key = new TextEncoder().encode(secretKey);

export async function getSessionDariSiakad() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('santri-session')?.value;
  
  if (!sessionToken) return null;
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    
    // Hasil payload ini berisi tipe:
    // { santriId: string, nama: string, isAktif: boolean }
    return payload;
  } catch {
    return null; // Token tidak valid atau kedaluwarsa
  }
}
