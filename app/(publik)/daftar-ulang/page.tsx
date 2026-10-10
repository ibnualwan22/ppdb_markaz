"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, Suspense } from "react";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function DaftarUlangContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "SANTRI") {
      router.push("/santri/daftar-ulang");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-dark-900 bg-luxury-pattern text-gray-200 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Image src="/images/logo.png" alt="Logo Markaz" width={80} height={80} className="mx-auto drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold-500 mt-4 tracking-wide">Daftar Ulang Santri</h1>
          <p className="text-gray-400 mt-2">Daftar Ulang Program Markaz Arabiyah</p>
        </div>

        {/* Card Pilih Jalur */}
        <div className="bg-dark-800/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-gold-500/20 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white border-b border-gold-500/10 pb-3 mb-6">Pilih Jalur Daftar Ulang</h2>
          <div className="grid grid-cols-1 gap-4">
            <a
              href="https://siakad.markazarabiyah.site/santri/daftar-ulang"
              className="cursor-pointer border-2 border-gold-500/60 bg-gold-500/10 hover:border-gold-400 hover:bg-gold-500/20 rounded-2xl p-6 transition-all text-center group block"
            >
              <div className="w-16 h-16 bg-gold-500/15 text-gold-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pendaftaran Santri Lama</h3>
              <p className="text-sm text-gray-400">Sudah punya NIS & akun Siakad — daftar ulang satu pintu via portal santri Siakad.</p>
            </a>

            <Link
              href="/daftar-ulang/manual"
              className="cursor-pointer border-2 border-dark-900 bg-dark-900 hover:border-gold-500/50 hover:bg-dark-800 rounded-2xl p-6 transition-all text-center group block"
            >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Belum Punya NIS</h3>
              <p className="text-sm text-gray-400">Santri lama sebelum Web dibuat (Sebelum Duf'ah 89).</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DaftarUlangPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900 flex items-center justify-center text-gold-500 font-bold">Memuat Form Daftar Ulang...</div>}>
      <DaftarUlangContent />
    </Suspense>
  );
}
